import { describe, expect, it, vi } from "vitest";
import { createDataLoader } from "../solution/02-cache-dedupe.js";

/** A deterministic stand-in for `queueMicrotask`: dispatch runs only when the test calls `flush`. */
function manualScheduler() {
  const pending: (() => void)[] = [];
  const scheduler = (callback: () => void): void => {
    pending.push(callback);
  };
  const flush = (): void => {
    const batch = pending.splice(0);
    for (const cb of batch) cb();
  };
  return { scheduler, flush };
}

describe("createDataLoader cache + dedupe", () => {
  it("caches a key across ticks: the batch fn stays at one call", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `v${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const p1 = loader.load(5);
    flush();
    expect(await p1).toBe("v5");

    const p2 = loader.load(5);
    flush();
    expect(await p2).toBe("v5");

    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent loads of the same key onto one promise and one batch slot", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `v${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const a = loader.load(9);
    const b = loader.load(9);
    expect(a).toBe(b); // same promise reference

    flush();
    expect(await a).toBe("v9");
    expect(await b).toBe("v9");
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([9]);
  });

  it("clear(key) evicts so the next load re-fetches", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `v${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const p1 = loader.load(1);
    flush();
    await p1;

    loader.clear(1);

    const p2 = loader.load(1);
    flush();
    await p2;

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it("clearAll() evicts every key", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `v${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const first = loader.loadMany([1, 2]);
    flush();
    await first;

    loader.clearAll();

    const p = loader.load(1);
    flush();
    await p;

    expect(batchFn).toHaveBeenCalledTimes(2);
    expect(batchFn.mock.calls[0]?.[0]).toEqual([1, 2]);
    expect(batchFn.mock.calls[1]?.[0]).toEqual([1]);
  });

  it("prime seeds a value without calling batchFn and never overwrites an existing entry", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `v${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    loader.prime(3, "primed3");

    const p = loader.load(3);
    flush();
    expect(await p).toBe("primed3");
    expect(batchFn).not.toHaveBeenCalled();

    loader.prime(3, "other"); // no overwrite
    expect(await loader.load(3)).toBe("primed3");
  });

  it("rejects only the failing caller and does not cache the failure (a retry re-batches)", async () => {
    const boom = new Error("missing 2");
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => (k === 2 ? boom : `v${k}`))),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const a = loader.load(1);
    const b = loader.load(2);
    flush();

    await expect(b).rejects.toBe(boom);
    expect(await a).toBe("v1");

    // The rejected key was evicted — loading it again issues a fresh batch.
    const b2 = loader.load(2);
    flush();
    await expect(b2).rejects.toBe(boom);
    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it("a late rejection of a cleared promise does not evict the fresh cache entry", async () => {
    // Guard at 02-cache-dedupe.ts:53 — `if (cache.get(ck) === promise) cache.delete(ck)`. After a
    // key is cleared and re-loaded, the ORIGINAL promise rejecting late must not evict the NEW
    // cached entry (a subsequent load stays a cache hit, no re-batch).
    let call = 0;
    let rejectFirst!: (reason: unknown) => void;
    const boom = new Error("late fail");
    const batchFn = vi.fn((keys: readonly number[]): Promise<string[]> => {
      call += 1;
      if (call === 1) {
        return new Promise<string[]>((_resolve, reject) => {
          rejectFirst = reject;
        });
      }
      return Promise.resolve(keys.map((k) => `fresh${k}`));
    });
    const { scheduler, flush } = manualScheduler();
    const loader = createDataLoader<number, string>(batchFn, { scheduler });

    const p1 = loader.load(1);
    p1.catch(() => {}); // p1 will reject late; keep it handled
    flush(); // batchFn call #1 — stays pending

    loader.clear(1);
    const p2 = loader.load(1);
    flush(); // batchFn call #2 — resolves the fresh entry
    expect(await p2).toBe("fresh1");

    // The original promise rejects AFTER the key was cleared and re-cached.
    rejectFirst(boom);
    await expect(p1).rejects.toBe(boom);

    // The fresh entry must survive: a follow-up load is a cache hit, no third batch.
    const p3 = loader.load(1);
    flush();
    expect(await p3).toBe("fresh1");
    expect(batchFn).toHaveBeenCalledTimes(2);
  });
});
