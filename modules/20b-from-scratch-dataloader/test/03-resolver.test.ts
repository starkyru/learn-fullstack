import { describe, expect, it, vi } from "vitest";
import {
  createUserLoader,
  makeUserBackend,
  resolveUsersNaive,
  resolveUsersWithLoader,
  type User,
} from "../solution/03-resolver.js";

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

/** Compare loader vs naive results without tripping on Error reference identity. */
function normalize(results: (User | Error)[]): unknown[] {
  return results.map((r) => (r instanceof Error ? { error: r.message } : r));
}

describe("resolver wired to the from-scratch loader", () => {
  it("resolves N ids through one backend call", async () => {
    const backend = vi.fn(makeUserBackend());
    const { scheduler, flush } = manualScheduler();
    const loader = createUserLoader(backend, { scheduler });

    const promise = resolveUsersWithLoader(loader, [1, 2, 3]);
    flush();
    const results = await promise;

    expect(results).toEqual([
      { id: 1, name: "Ada" },
      { id: 2, name: "Linus" },
      { id: 3, name: "Grace" },
    ]);
    expect(backend).toHaveBeenCalledTimes(1);
    expect(backend).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("loader path matches the naive path result-for-result", async () => {
    const loaderBackend = vi.fn(makeUserBackend());
    const naiveBackend = vi.fn(makeUserBackend());
    const { scheduler, flush } = manualScheduler();
    const loader = createUserLoader(loaderBackend, { scheduler });
    const ids = [1, 2, 3, 4];

    const loaderPromise = resolveUsersWithLoader(loader, ids);
    flush();
    const loaderResults = await loaderPromise;
    const naiveResults = await resolveUsersNaive(naiveBackend, ids);

    expect(loaderResults).toEqual([
      { id: 1, name: "Ada" },
      { id: 2, name: "Linus" },
      { id: 3, name: "Grace" },
      { id: 4, name: "Alan" },
    ]);
    expect(normalize(loaderResults)).toEqual(normalize(naiveResults));
  });

  it("collapses the N+1: loader hits the backend once, naive hits it per id", async () => {
    const loaderBackend = vi.fn(makeUserBackend());
    const naiveBackend = vi.fn(makeUserBackend());
    const { scheduler, flush } = manualScheduler();
    const loader = createUserLoader(loaderBackend, { scheduler });

    const loaderPromise = resolveUsersWithLoader(loader, [1, 2, 3]);
    flush();
    await loaderPromise;
    await resolveUsersNaive(naiveBackend, [1, 2, 3]);

    expect(loaderBackend).toHaveBeenCalledTimes(1);
    expect(naiveBackend).toHaveBeenCalledTimes(3);
  });

  it("produces matching Error slots for unknown ids on both paths", async () => {
    const loaderBackend = vi.fn(makeUserBackend());
    const naiveBackend = vi.fn(makeUserBackend());
    const { scheduler, flush } = manualScheduler();
    const loader = createUserLoader(loaderBackend, { scheduler });
    const ids = [1, 99];

    const loaderPromise = resolveUsersWithLoader(loader, ids);
    flush();
    const loaderResults = await loaderPromise;
    const naiveResults = await resolveUsersNaive(naiveBackend, ids);

    expect(loaderResults[0]).toEqual({ id: 1, name: "Ada" });
    expect(loaderResults[1]).toBeInstanceOf(Error);
    expect((loaderResults[1] as Error).message).toBe("user 99 not found");
    expect(normalize(loaderResults)).toEqual(normalize(naiveResults));
  });

  it("dedupes repeated ids into distinct backend keys yet returns per-index results", async () => {
    const loaderBackend = vi.fn(makeUserBackend());
    const naiveBackend = vi.fn(makeUserBackend());
    const { scheduler, flush } = manualScheduler();
    const loader = createUserLoader(loaderBackend, { scheduler });
    const ids = [2, 2, 1, 2];

    const loaderPromise = resolveUsersWithLoader(loader, ids);
    flush();
    const loaderResults = await loaderPromise;
    const naiveResults = await resolveUsersNaive(naiveBackend, ids);

    expect(loaderBackend).toHaveBeenCalledTimes(1);
    expect(loaderBackend).toHaveBeenCalledWith([2, 1]); // distinct, first-seen order
    expect(loaderResults).toEqual([
      { id: 2, name: "Linus" },
      { id: 2, name: "Linus" },
      { id: 1, name: "Ada" },
      { id: 2, name: "Linus" },
    ]);
    expect(normalize(loaderResults)).toEqual(normalize(naiveResults));
  });
});
