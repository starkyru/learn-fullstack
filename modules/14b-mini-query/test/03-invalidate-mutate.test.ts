import { describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../solution/01-query-cache.js";
import { invalidateQuery, mutate } from "../solution/03-invalidate-mutate.js";

describe("invalidateQuery", () => {
  it("refetches an actively-subscribed key and notifies its subscribers with new data", async () => {
    const client = createQueryClient();
    let n = 0;
    const fetcher = vi.fn(async () => {
      n += 1;
      return n;
    });

    await client.fetchQuery(["k"], fetcher);
    expect(client.getQueryData(["k"])).toBe(1);

    const listener = vi.fn();
    client.subscribe(["k"], listener);
    listener.mockClear();

    await invalidateQuery(client, ["k"]);

    expect(fetcher).toHaveBeenCalledTimes(2); // invalidation triggered a refetch
    expect(client.getQueryData(["k"])).toBe(2);
    expect(listener).toHaveBeenCalled(); // subscribers were notified of the new state
  });

  it("does NOT refetch an unobserved key but leaves it stale for the next fetch", async () => {
    const client = createQueryClient();
    let n = 0;
    const fetcher = vi.fn(async () => {
      n += 1;
      return n;
    });

    await client.fetchQuery(["k"], fetcher, { staleTime: 100_000 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await invalidateQuery(client, ["k"]); // no subscribers → no immediate refetch
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Marked stale, so even a long staleTime refetches on the next fetch.
    await client.fetchQuery(["k"], fetcher, { staleTime: 100_000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(["k"])).toBe(2);
  });
  it("marks stale with a true -Infinity sentinel (distinguishable from 0 under a near-epoch clock)", async () => {
    // A near-epoch clock: with updatedAt:0, now()-0 = 5 would look FRESH under a big staleTime.
    // Only a genuine -Infinity sentinel forces the next fetch to be treated as stale.
    const t = 5;
    const client = createQueryClient({ now: () => t });
    let n = 0;
    const fetcher = vi.fn(async () => {
      n += 1;
      return n;
    });

    await client.fetchQuery(["k"], fetcher, { staleTime: 100_000 }); // updatedAt = 5
    expect(fetcher).toHaveBeenCalledTimes(1);

    await invalidateQuery(client, ["k"]); // unobserved → just marks stale, no refetch
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Clock is still near epoch (5). With updatedAt:0 the entry would read fresh (5 < 100_000)
    // and skip the fetcher; the -Infinity sentinel makes it stale so the fetcher runs again.
    await client.fetchQuery(["k"], fetcher, { staleTime: 100_000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(["k"])).toBe(2);
  });
});

describe("mutate", () => {
  it("applies an optimistic update, then rolls back to the exact previous value on error", async () => {
    const client = createQueryClient();
    client.setQueryData(["todo"], { text: "original" });

    const promise = mutate(client, {
      mutationFn: () => Promise.reject(new Error("boom")),
      onMutate: () => {
        const prev = client.getQueryData<{ text: string }>(["todo"]);
        client.setQueryData(["todo"], { text: "optimistic" });
        return { prev };
      },
      rollback: (context) => {
        client.setQueryData(["todo"], context?.prev);
      },
    });

    // onMutate ran synchronously, so the optimistic value is already in the cache.
    expect(client.getQueryData(["todo"])).toEqual({ text: "optimistic" });

    await expect(promise).rejects.toThrow("boom");

    // Rolled back to the precise previous value, not a merge or a default.
    expect(client.getQueryData(["todo"])).toEqual({ text: "original" });
  });

  it("returns the mutationFn result and invalidates keys on success", async () => {
    const client = createQueryClient();
    let n = 0;
    const fetcher = vi.fn(async () => {
      n += 1;
      return n;
    });

    await client.fetchQuery(["list"], fetcher); // data = 1
    client.subscribe(["list"], vi.fn()); // an active subscriber so invalidate refetches

    const result = await mutate(client, {
      mutationFn: async () => "created",
      invalidateKeys: [["list"]],
    });

    expect(result).toBe("created");
    expect(fetcher).toHaveBeenCalledTimes(2); // invalidateKeys refetched the list
    expect(client.getQueryData(["list"])).toBe(2);
  });

  it("passes the onMutate context, error, and variables to rollback and rethrows", async () => {
    const client = createQueryClient();
    const rollback = vi.fn();
    const err = new Error("x");

    await expect(
      mutate(client, {
        mutationFn: () => Promise.reject(err),
        variables: 7,
        onMutate: () => ({ token: 99 }),
        rollback,
      }),
    ).rejects.toBe(err);

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(rollback).toHaveBeenCalledWith({ token: 99 }, err, 7);
  });
});
