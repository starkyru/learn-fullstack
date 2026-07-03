/**
 * A from-scratch model of Next's tag-based fetch cache (`fetch(url, { next: { tags } })`
 * + `revalidateTag`). The real Next data cache memoizes fetches by key and lets you
 * invalidate a slice of it on demand by tag — this reimplements that contract with an
 * injected clock so TTL expiry is deterministic and fully unit-testable.
 */

/** Injected time source — keep tests deterministic (no `Date.now`). */
export interface Clock {
  now(): number;
}

export interface CachedFetchOptions {
  /** Tags this entry belongs to; `revalidateTag(tag)` evicts every entry carrying it. */
  tags?: string[];
  /** Time-to-live in ms. Entry is stale once `clock.now() >= storedAt + ttlMs`. Default: never expires. */
  ttlMs?: number;
}

interface Entry {
  value: unknown;
  tags: string[];
  storedAt: number;
  ttlMs: number;
}

export interface TagCache {
  cachedFetch<T>(
    key: string,
    opts: CachedFetchOptions,
    fetcher: () => Promise<T>,
  ): Promise<T>;
  revalidateTag(tag: string): void;
}

export function createTagCache(clock: Clock): TagCache {
  const store = new Map<string, Entry>();

  /**
   * WORKED EXAMPLE — memoize by `key`. A fresh, unexpired entry is returned WITHOUT
   * calling `fetcher` again (that's the "one fetch for repeated keys" guarantee). On a
   * miss (or a stale/expired entry) we call `fetcher`, store the value with its tags and
   * the current time, and return it.
   */
  async function cachedFetch<T>(
    key: string,
    opts: CachedFetchOptions,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const existing = store.get(key);
    if (existing && clock.now() < existing.storedAt + existing.ttlMs) {
      return existing.value as T;
    }
    const value = await fetcher();
    store.set(key, {
      value,
      tags: opts.tags ?? [],
      storedAt: clock.now(),
      ttlMs: opts.ttlMs ?? Number.POSITIVE_INFINITY,
    });
    return value;
  }

  /**
   * ANALOG (learner builds this in `src/`) — invalidate EXACTLY the entries whose `tags`
   * include `tag` by deleting them from the store, so the next `cachedFetch` for those
   * keys misses and refetches. Entries without the tag are left untouched.
   */
  function revalidateTag(tag: string): void {
    for (const [key, entry] of store) {
      if (entry.tags.includes(tag)) store.delete(key);
    }
  }

  return { cachedFetch, revalidateTag };
}
