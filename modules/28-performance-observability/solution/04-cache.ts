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

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export function createCache<K, V>(deps: CacheDeps): Cache<K, V> {
  const map = new Map<K, Entry<V>>();

  const isExpired = (e: Entry<V>): boolean => deps.clock() >= e.expiresAt;

  const evictIfNeeded = (): void => {
    while (map.size > deps.max) {
      const oldest = map.keys().next();
      if (oldest.done) break;
      map.delete(oldest.value);
    }
  };

  return {
    get(key) {
      const e = map.get(key);
      if (!e) return undefined;
      if (isExpired(e)) {
        map.delete(key);
        return undefined;
      }
      // Mark most-recently-used: delete + re-insert moves the key to the end.
      map.delete(key);
      map.set(key, e);
      return e.value;
    },
    set(key, value) {
      // Re-insert so an updated key counts as most-recently-used.
      if (map.has(key)) map.delete(key);
      map.set(key, { value, expiresAt: deps.clock() + deps.ttlMs });
      evictIfNeeded();
    },
    has(key) {
      const e = map.get(key);
      if (!e) return false;
      if (isExpired(e)) {
        map.delete(key);
        return false;
      }
      return true;
    },
    delete(key) {
      return map.delete(key);
    },
    get size() {
      return map.size;
    },
    keys() {
      return [...map.keys()];
    },
  };
}

export interface MemoOptions<A extends unknown[]> {
  max: number;
  ttlMs: number;
  clock: () => number;
  /** Derive a cache key from the args (default: `JSON.stringify(args)`). */
  keyOf?: (...args: A) => string;
}

/**
 * Wrap `fn` so identical calls (same derived key) return a cached result and skip the backing
 * call, until the entry expires or is evicted. Repeated hot-path calls collapse to one real hit.
 */
export function memoize<A extends unknown[], R>(
  fn: (...args: A) => R,
  opts: MemoOptions<A>,
): (...args: A) => R {
  const cache = createCache<string, R>({
    max: opts.max,
    ttlMs: opts.ttlMs,
    clock: opts.clock,
  });
  const keyOf = opts.keyOf ?? ((...args: A): string => JSON.stringify(args));

  return (...args: A): R => {
    const key = keyOf(...args);
    if (cache.has(key)) {
      return cache.get(key) as R;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
