import { describe, expect, it, vi } from "vitest";
import { createBatchScheduler } from "../solution/01-batch-scheduler.js";

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

describe("createBatchScheduler", () => {
  it("coalesces 5 concurrent loads into one batchFn call, mapping each key to its value", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => k * 10)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const promises = [1, 2, 3, 4, 5].map((k) => loader.load(k));
    flush();
    const results = await Promise.all(promises);

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it("dedupes duplicate keys in a tick: batchFn sees distinct keys, both callers get the value", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => `u${k}`)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, string>(batchFn, { scheduler });

    const a = loader.load(7);
    const b = loader.load(7);
    const c = loader.load(8);
    flush();

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([7, 8]);
    expect(await a).toBe("u7");
    expect(await b).toBe("u7");
    expect(await c).toBe("u8");
  });

  it("starts a fresh batch each tick", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => k * 2)),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const p1 = loader.load(1);
    flush();
    expect(await p1).toBe(2);

    const p2 = loader.load(2);
    flush();
    expect(await p2).toBe(4);

    expect(batchFn).toHaveBeenCalledTimes(2);
    expect(batchFn.mock.calls[0]?.[0]).toEqual([1]);
    expect(batchFn.mock.calls[1]?.[0]).toEqual([2]);
  });

  it("rejects only the caller whose slot is an Error; the rest resolve", async () => {
    const boom = new Error("no 2");
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => (k === 2 ? boom : k * 10))),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const a = loader.load(1);
    const b = loader.load(2);
    const c = loader.load(3);
    flush();

    await expect(b).rejects.toBe(boom);
    expect(await a).toBe(10);
    expect(await c).toBe(30);
  });

  it("rejects the whole batch when batchFn returns a wrong-length array", async () => {
    const batchFn = vi.fn((_keys: readonly number[]) => Promise.resolve([1] as number[]));
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const a = loader.load(1);
    const b = loader.load(2);
    flush();

    await expect(a).rejects.toThrow("batchFn must return an array of length 2, got 1");
    await expect(b).rejects.toThrow("batchFn must return an array of length 2, got 1");
  });

  it("loadMany settles each key to a value or Error, preserving order", async () => {
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => (k === 2 ? new Error("bad 2") : k * 10))),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const promise = loader.loadMany([1, 2, 3]);
    flush();
    const results = await promise;

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(results[0]).toBe(10);
    expect(results[1]).toBeInstanceOf(Error);
    expect((results[1] as Error).message).toBe("bad 2");
    expect(results[2]).toBe(30);
  });

  it("rejects the whole batch when batchFn resolves to a non-array (reports the typeof)", async () => {
    // Guard at 01-batch-scheduler.ts:73 — `!Array.isArray(values)`. A non-array result must be
    // caught before `.length` is read; the error names the offending typeof.
    const batchFn = vi.fn((_keys: readonly number[]) =>
      Promise.resolve(undefined as unknown as (number | Error)[]),
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const a = loader.load(1);
    flush();

    await expect(a).rejects.toThrow(
      "batchFn must return an array of length 1, got undefined",
    );
  });

  it("loadMany wraps a non-Error batch rejection into an Error instance", async () => {
    // Wrap at 01-batch-scheduler.ts:113 — `new Error(String(reason))`. A whole-batch rejection with
    // a non-Error reason must still surface as an Error per key.
    const batchFn = vi.fn(
      (_keys: readonly number[]) =>
        Promise.reject("kaboom") as Promise<(number | Error)[]>,
    );
    const { scheduler, flush } = manualScheduler();
    const loader = createBatchScheduler<number, number>(batchFn, { scheduler });

    const promise = loader.loadMany([1, 2]);
    flush();
    const results = await promise;

    expect(results[0]).toBeInstanceOf(Error);
    expect((results[0] as Error).message).toBe("kaboom");
    expect(results[1]).toBeInstanceOf(Error);
    expect((results[1] as Error).message).toBe("kaboom");
  });

  it("uses queueMicrotask by default (no scheduler injected): concurrent loads coalesce", async () => {
    // Default scheduler path at 01-batch-scheduler.ts:40. With NO scheduler injected, a real
    // microtask flush must still coalesce the tick into exactly one batchFn call.
    const batchFn = vi.fn((keys: readonly number[]) =>
      Promise.resolve(keys.map((k) => k * 10)),
    );
    const loader = createBatchScheduler<number, number>(batchFn);

    const promises = [1, 2, 3].map((k) => loader.load(k));
    const results = await Promise.all(promises);

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);
    expect(results).toEqual([10, 20, 30]);
  });
});
