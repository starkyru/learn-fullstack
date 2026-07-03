/**
 * A cross-route tag cache — the model behind Next's `unstable_cache` + `revalidateTag`.
 *
 * A single shared registry stores one entry per cache key (a route's data). Every entry carries a
 * set of *tags*. A mutation calls `revalidateTag(tag)` and EVERY entry carrying that tag goes stale
 * across all routes at once. `get` returns `undefined` for a stale (or missing) entry.
 *
 * YOUR TURN — implement `createTagCache`:
 *   - keep a `Map<key, entry>` AND a reverse `Map<tag, Set<key>>` index;
 *   - `set(key, value, tags)` stores/refreshes the entry (fresh) and re-indexes its tags;
 *   - `get(key)` returns the value only if present AND fresh, else `undefined`;
 *   - `peek(key)` returns the raw entry (with its `stale` flag);
 *   - `revalidateTag(tag)` marks every entry with that tag stale and returns the keys that went
 *     fresh→stale, SORTED (deterministic);
 *   - `keys()` returns all live keys, sorted.
 */

export interface CacheEntry<V> {
  key: string;
  value: V;
  tags: string[];
  stale: boolean;
}

export interface TagCache<V> {
  set(key: string, value: V, tags: readonly string[]): void;
  get(key: string): V | undefined;
  peek(key: string): CacheEntry<V> | undefined;
  revalidateTag(tag: string): string[];
  keys(): string[];
}

export function createTagCache<V>(): TagCache<V> {
  throw new Error(
    "TODO: build the tag registry (set / get / peek / revalidateTag / keys)",
  );
}
