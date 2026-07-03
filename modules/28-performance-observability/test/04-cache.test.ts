import { describe, expect, it } from "vitest";
import { createCache, memoize } from "../solution/04-cache.js";

/** A mutable clock the test drives by hand. */
function mkClock(start = 0) {
  let t = start;
  return { now: () => t, set: (v: number) => (t = v) };
}

describe("createCache — LRU eviction", () => {
  it("evicts the least-recently-used key when size exceeds max", () => {
    const clock = mkClock();
    const cache = createCache<string, number>({
      max: 2,
      ttlMs: 10_000,
      clock: clock.now,
    });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // touch "a" → now "b" is least-recently-used
    cache.set("c", 3); // over max → evict "b"

    expect(cache.keys()).toEqual(["a", "c"]);
    expect(cache.has("b")).toBe(false);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });
});

describe("createCache — TTL expiry", () => {
  it("treats a read at or past expiresAt as a miss (by the injected clock)", () => {
    const clock = mkClock(0);
    const cache = createCache<string, string>({ max: 10, ttlMs: 100, clock: clock.now });
    cache.set("k", "v"); // expiresAt = 0 + 100 = 100

    clock.set(99);
    expect(cache.has("k")).toBe(true);
    expect(cache.get("k")).toBe("v");

    clock.set(100); // clock() >= expiresAt → expired
    expect(cache.has("k")).toBe(false);
    expect(cache.get("k")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  // Guards get()'s OWN expiry branch: the has()-first test above masks it because has()
  // already evicts the entry, so get() only ever hits its `!e` early-return there.
  it("get() alone (no prior has()) on an expired entry misses AND evicts the key", () => {
    const clock = mkClock(0);
    const cache = createCache<string, string>({ max: 10, ttlMs: 100, clock: clock.now });
    cache.set("k", "v"); // expiresAt = 0 + 100 = 100

    clock.set(150); // past expiresAt → expired
    expect(cache.get("k")).toBeUndefined(); // dies to `if (isExpired(e))` -> `if (false)` (returns "v")
    expect(cache.size).toBe(0); // dies to deleting get()'s map.delete on expiry (stays 1)
    expect(cache.keys()).toEqual([]);
  });
});

describe("memoize", () => {
  it("collapses repeated calls with the same args to one backing hit", () => {
    const clock = mkClock();
    let calls = 0;
    const double = (n: number): number => {
      calls++;
      return n * 2;
    };
    const memoDouble = memoize(double, { max: 10, ttlMs: 1000, clock: clock.now });

    expect(memoDouble(5)).toBe(10);
    expect(memoDouble(5)).toBe(10);
    expect(memoDouble(5)).toBe(10);
    expect(calls).toBe(1);

    memoDouble(6); // different args → a second backing hit
    expect(calls).toBe(2);
  });

  it("recomputes once the entry expires by the clock", () => {
    const clock = mkClock(0);
    let calls = 0;
    const memoDouble = memoize(
      (n: number): number => {
        calls++;
        return n * 2;
      },
      { max: 10, ttlMs: 1000, clock: clock.now },
    );

    memoDouble(5); // cached at t=0, expiresAt=1000
    expect(calls).toBe(1);
    clock.set(1000); // expired
    expect(memoDouble(5)).toBe(10);
    expect(calls).toBe(2);
  });
});
