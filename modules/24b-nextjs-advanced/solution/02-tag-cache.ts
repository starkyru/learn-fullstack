/**
 * A cross-route tag cache — the model behind Next's `unstable_cache` + `revalidateTag`.
 *
 * A single shared registry stores one entry per cache key (a route's data). Every entry carries a
 * set of *tags*. A mutation calls `revalidateTag(tag)` and EVERY entry carrying that tag goes stale
 * across all routes at once — so one `/cards/42` mutation can invalidate both the `/cards/42`
 * detail cache and the `/cards` list cache while leaving `/cards/7` fresh. `get` returns `undefined`
 * for a stale (or missing) entry, which is the "cache miss → refetch" signal.
 *
 * A reverse tag→keys index makes `revalidateTag` O(entries-for-that-tag), not O(all-entries).
 */

export interface CacheEntry<V> {
  key: string;
  value: V;
  tags: string[];
  stale: boolean;
}

export interface TagCache<V> {
  /** Store `value` under `key`, tagged with `tags` (re-setting refreshes it and re-indexes tags). */
  set(key: string, value: V, tags: readonly string[]): void;
  /** The value if present AND fresh; `undefined` on a miss or a stale entry. */
  get(key: string): V | undefined;
  /** The raw entry (including its `stale` flag) without the freshness gate. */
  peek(key: string): CacheEntry<V> | undefined;
  /** Mark every entry carrying `tag` stale; returns the keys that went fresh→stale (sorted). */
  revalidateTag(tag: string): string[];
  /** All live keys (sorted). */
  keys(): string[];
}

export function createTagCache<V>(): TagCache<V> {
  const entries = new Map<string, CacheEntry<V>>();
  const tagIndex = new Map<string, Set<string>>();

  function index(key: string, tags: readonly string[]): void {
    for (const tag of tags) {
      let keys = tagIndex.get(tag);
      if (!keys) {
        keys = new Set<string>();
        tagIndex.set(tag, keys);
      }
      keys.add(key);
    }
  }

  function deindex(key: string, tags: readonly string[]): void {
    for (const tag of tags) {
      const keys = tagIndex.get(tag);
      if (!keys) continue;
      keys.delete(key);
      if (keys.size === 0) tagIndex.delete(tag);
    }
  }

  return {
    set(key, value, tags) {
      const previous = entries.get(key);
      if (previous) deindex(key, previous.tags);
      const nextTags = [...tags];
      entries.set(key, { key, value, tags: nextTags, stale: false });
      index(key, nextTags);
    },

    get(key) {
      const entry = entries.get(key);
      if (!entry || entry.stale) return undefined;
      return entry.value;
    },

    peek(key) {
      return entries.get(key);
    },

    revalidateTag(tag) {
      const keys = tagIndex.get(tag);
      if (!keys) return [];
      const invalidated: string[] = [];
      for (const key of keys) {
        const entry = entries.get(key);
        if (entry && !entry.stale) {
          entry.stale = true;
          invalidated.push(key);
        }
      }
      return invalidated.sort();
    },

    keys() {
      return [...entries.keys()].sort();
    },
  };
}
