/**
 * Task 4 — Caching layer (FROM SCRATCH): an LRU + per-entry TTL cache.
 *
 * Two independent eviction rules on one `Map` (which preserves insertion order):
 *   - LRU  — the least-recently-used key is the FIRST key; a `get` deletes+re-inserts to mark a
 *            key recent, so the oldest untouched key is evicted first once size exceeds `max`.
 *   - TTL  — each entry stamps `expiresAt = clock() + ttlMs`; a read past that is a miss and the
 *            entry is dropped. The clock is injected, so expiry is deterministic.
 *
 * `memoize` is just this cache keyed by a call's arguments — a hit skips the backing function.
 */

export interface CacheDeps {
  /** Max live entries; adding beyond this evicts the least-recently-used key. */
  max: number;
  /** Per-entry lifetime in ms. */
  ttlMs: number;
  /** Injected clock in ms — expiry is checked against this, never `Date.now()`. */
  clock: () => number;
}

export interface Cache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  readonly size: number;
  /** Live keys in LRU order (least-recently-used first). */
  keys(): K[];
}

/**
 * YOUR TURN — build the cache over a `Map<K, { value, expiresAt }>`:
 *   - `isExpired(e)` → `clock() >= e.expiresAt`.
 *   - `get(key)` → miss if absent; if expired, delete + miss; else delete+re-insert (mark recent)
 *     and return the value.
 *   - `set(key, value)` → if present, delete first; insert `{ value, expiresAt: clock() + ttlMs }`;
 *     then while `map.size > max`, delete the first (oldest) key.
 *   - `has(key)` → false if absent or expired (dropping it); else true.
 *   - `delete`, `size` (getter), `keys()` (array of live keys, oldest first).
 */
export function createCache<K, V>(_deps: CacheDeps): Cache<K, V> {
  throw new Error("TODO: build an LRU + TTL cache with get/set/has/delete/size/keys");
}

export interface MemoOptions<A extends unknown[]> {
  max: number;
  ttlMs: number;
  clock: () => number;
  /** Derive a cache key from the args (default: `JSON.stringify(args)`). */
  keyOf?: (...args: A) => string;
}

/**
 * YOUR TURN — wrap `fn` with a `createCache` keyed by the args:
 *   1. Build a `createCache<string, R>({ max, ttlMs, clock })`.
 *   2. `keyOf` defaults to `(...args) => JSON.stringify(args)`.
 *   3. Return `(...args) => { const key = keyOf(...args); if (cache.has(key)) return cache.get(key)!;
 *      const result = fn(...args); cache.set(key, result); return result; }`.
 */
export function memoize<A extends unknown[], R>(
  _fn: (...args: A) => R,
  _opts: MemoOptions<A>,
): (...args: A) => R {
  throw new Error("TODO: memoize fn through an LRU+TTL cache keyed by its args");
}
