import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../solution/01-query-cache.js";

describe("createQueryClient — cache + fetchQuery", () => {
  it("runs the fetcher, caches the result, and reports success", async () => {
    const client = createQueryClient();
    const data = await client.fetchQuery(["greeting"], async () => "hello");

    expect(data).toBe("hello");
    expect(client.getQueryData(["greeting"])).toBe("hello");

    const entry = client.getEntry(["greeting"]);
    expect(entry.status).toBe("success");
    expect(entry.isFetching).toBe(false);
    expect(entry.promise).toBeUndefined();
  });

  it("dedupes concurrent fetches of the same key into ONE request", async () => {
    const client = createQueryClient();
    let resolve!: (value: string) => void;
    const fetcher = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const p1 = client.fetchQuery(["k"], fetcher);
    const p2 = client.fetchQuery(["k"], fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1); // second call rode the in-flight promise
    expect(p2).toBe(p1); // literally the same promise handed back

    resolve("shared");
    expect(await p1).toBe("shared");
    expect(await p2).toBe("shared");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("skips the fetcher for a fresh cache hit but refetches once stale (injected clock)", async () => {
    let t = 0;
    const client = createQueryClient({ now: () => t });
    const fetcher = vi.fn(async () => "v");

    await client.fetchQuery(["k"], fetcher, { staleTime: 1000 }); // updatedAt = 0
    expect(fetcher).toHaveBeenCalledTimes(1);

    t = 500; // 500 - 0 < 1000 → still fresh
    await client.fetchQuery(["k"], fetcher, { staleTime: 1000 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    t = 2000; // 2000 - 0 >= 1000 → stale
    await client.fetchQuery(["k"], fetcher, { staleTime: 1000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers on a write and stops after unsubscribe", () => {
    const client = createQueryClient();
    const listener = vi.fn();
    const unsubscribe = client.subscribe(["k"], listener);

    client.setQueryData(["k"], 1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(client.getSubscriberCount(["k"])).toBe(1);

    unsubscribe();
    client.setQueryData(["k"], 2);
    expect(listener).toHaveBeenCalledTimes(1); // no further notifications
    expect(client.getSubscriberCount(["k"])).toBe(0);
  });

  it("records the error and clears isFetching when the fetcher rejects", async () => {
    const client = createQueryClient();
    const boom = new Error("network down");

    await expect(
      client.fetchQuery(["k"], async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);

    const entry = client.getEntry(["k"]);
    expect(entry.status).toBe("error");
    expect(entry.error).toBe(boom);
    expect(entry.isFetching).toBe(false);
    expect(entry.promise).toBeUndefined();
  });

  it("keeps cached data and status 'success' during a background refetch (no loading flash)", async () => {
    let t = 0;
    const client = createQueryClient({ now: () => t });

    // First successful fetch: data is present, status settles to success.
    await client.fetchQuery(["k"], async () => "first");
    expect(client.getQueryData(["k"])).toBe("first");
    expect(client.getEntry(["k"]).status).toBe("success");

    // Advance the clock so the entry is unambiguously stale (default staleTime 0),
    // guaranteeing a real background refetch regardless of the freshness comparator.
    t = 1000;
    let resolveRefetch!: (value: string) => void;
    const refetch = client.fetchQuery(
      ["k"],
      () => new Promise<string>((r) => (resolveRefetch = r)),
    );

    // WHILE the refetch is in flight: existing data stays, status must remain "success",
    // NOT flash back to "pending" — but isFetching flips true.
    const inFlight = client.getEntry<string>(["k"]);
    expect(inFlight.status).toBe("success");
    expect(inFlight.data).toBe("first");
    expect(inFlight.isFetching).toBe(true);

    resolveRefetch("second");
    await refetch;

    const settled = client.getEntry<string>(["k"]);
    expect(settled.status).toBe("success");
    expect(settled.data).toBe("second");
    expect(settled.isFetching).toBe(false);
  });

  it("a superseded slow request does NOT overwrite the newer request's data (out-of-order guard)", async () => {
    const client = createQueryClient();

    // Fetch A starts and stays in flight.
    let resolveA!: (value: string) => void;
    const pA = client.fetchQuery(["k"], () => new Promise<string>((r) => (resolveA = r)));

    // Supersede A: clear the in-flight promise so a fresh request B can start for the same key.
    client.setEntry(["k"], { promise: undefined });

    let resolveB!: (value: string) => void;
    const pB = client.fetchQuery(["k"], () => new Promise<string>((r) => (resolveB = r)));

    // B settles first and becomes the current value.
    resolveB("B");
    await pB;
    expect(client.getQueryData(["k"])).toBe("B");

    // A (the superseded request) resolves LAST — its stale result must be dropped.
    resolveA("A");
    await pA;
    expect(client.getQueryData(["k"])).toBe("B");
    expect(client.getEntry(["k"]).status).toBe("success");
  });

  it("treats now()-updatedAt === staleTime as STALE (refetches at the exact boundary)", async () => {
    let t = 0;
    const client = createQueryClient({ now: () => t });
    const fetcher = vi.fn(async () => "v");

    await client.fetchQuery(["k"], fetcher, { staleTime: 1000 }); // updatedAt = 0
    expect(fetcher).toHaveBeenCalledTimes(1);

    t = 1000; // 1000 - 0 === 1000: NOT < 1000 → stale → refetch
    await client.fetchQuery(["k"], fetcher, { staleTime: 1000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps separate keys independent", async () => {
    const client = createQueryClient();
    await client.fetchQuery(["a"], async () => "A");
    await client.fetchQuery(["b"], async () => "B");

    expect(client.getQueryData(["a"])).toBe("A");
    expect(client.getQueryData(["b"])).toBe("B");
  });
});
