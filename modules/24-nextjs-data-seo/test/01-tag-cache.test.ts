import { describe, expect, it, vi } from "vitest";
import { createTagCache, type Clock } from "../solution/01-tag-cache.js";

/** A hand-cranked clock — the test advances `t` explicitly; nothing reads the wall clock. */
function fakeClock(): Clock & { t: number } {
  return {
    t: 0,
    now() {
      return this.t;
    },
  };
}

describe("createTagCache — cachedFetch + revalidateTag", () => {
  it("memoizes: repeated keys call the fetcher exactly once and reuse the value", async () => {
    const cache = createTagCache(fakeClock());
    const fetcher = vi.fn(async () => ({ cards: ["a", "b"] }));

    const first = await cache.cachedFetch("board", { tags: ["board"] }, fetcher);
    const second = await cache.cachedFetch("board", { tags: ["board"] }, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ cards: ["a", "b"] });
    expect(second).toBe(first);
  });

  it("revalidateTag evicts EXACTLY the tagged entries and leaves others cached", async () => {
    const cache = createTagCache(fakeClock());
    const board = vi.fn(async () => "board-v1");
    const feed = vi.fn(async () => "feed-v1");

    await cache.cachedFetch("board", { tags: ["board"] }, board);
    await cache.cachedFetch("feed", { tags: ["feed"] }, feed);

    cache.revalidateTag("board");

    // board was tagged → next read misses and refetches; feed stays cached.
    await cache.cachedFetch("board", { tags: ["board"] }, board);
    await cache.cachedFetch("feed", { tags: ["feed"] }, feed);

    expect(board).toHaveBeenCalledTimes(2);
    expect(feed).toHaveBeenCalledTimes(1);
  });

  it("a single revalidateTag evicts every entry sharing that tag", async () => {
    const cache = createTagCache(fakeClock());
    const a = vi.fn(async () => "a");
    const b = vi.fn(async () => "b");
    const c = vi.fn(async () => "c");

    await cache.cachedFetch("a", { tags: ["cards", "col-1"] }, a);
    await cache.cachedFetch("b", { tags: ["cards", "col-2"] }, b);
    await cache.cachedFetch("c", { tags: ["labels"] }, c);

    cache.revalidateTag("cards");

    await cache.cachedFetch("a", { tags: ["cards", "col-1"] }, a);
    await cache.cachedFetch("b", { tags: ["cards", "col-2"] }, b);
    await cache.cachedFetch("c", { tags: ["labels"] }, c);

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c).toHaveBeenCalledTimes(1);
  });

  it("revalidating an unknown tag evicts nothing", async () => {
    const cache = createTagCache(fakeClock());
    const board = vi.fn(async () => "board");

    await cache.cachedFetch("board", { tags: ["board"] }, board);
    cache.revalidateTag("nope");
    await cache.cachedFetch("board", { tags: ["board"] }, board);

    expect(board).toHaveBeenCalledTimes(1);
  });

  it("honors TTL against the injected clock: expired entries refetch, fresh ones do not", async () => {
    const clock = fakeClock();
    const cache = createTagCache(clock);
    const fetcher = vi.fn(async () => "v");

    await cache.cachedFetch("k", { ttlMs: 1000 }, fetcher);

    clock.t = 999; // still fresh
    await cache.cachedFetch("k", { ttlMs: 1000 }, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);

    clock.t = 1000; // storedAt(0) + ttl(1000) reached → stale
    await cache.cachedFetch("k", { ttlMs: 1000 }, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
