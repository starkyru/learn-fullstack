import { createBatchScheduler } from "./01-batch-scheduler.js";
import type { BatchFn, Scheduler } from "./01-batch-scheduler.js";

/**
 * The cache + dedupe layer on top of the tick batcher (01). This is the full `createDataLoader`
 * contract: it memoises by key so a repeated key — within OR across ticks — reuses the SAME promise
 * and is never re-fetched, and it de-duplicates concurrent loads for the same key onto one promise.
 *
 *   - `load(key)` returns the cached promise if present; otherwise it enqueues the key on the batch
 *     scheduler, caches the resulting promise (keyed by `cacheKeyFn`), and returns it.
 *   - A promise that REJECTS is evicted from the cache, so a later load retries instead of replaying
 *     a stale failure. (Successful values stay cached until explicitly cleared.)
 *   - `clear` / `clearAll` evict; `prime` seeds a value WITHOUT calling the batch fn and never
 *     overwrites an existing cache entry.
 */

export interface DataLoaderOptions<K> {
  /** Passed through to the batch scheduler; inject a fake in tests. */
  scheduler?: Scheduler;
  /** Cache/dedupe identity for a key. Defaults to identity (good for primitive keys). */
  cacheKeyFn?: (key: K) => unknown;
}

export interface DataLoader<K, V> {
  load: (key: K) => Promise<V>;
  loadMany: (keys: readonly K[]) => Promise<(V | Error)[]>;
  clear: (key: K) => void;
  clearAll: () => void;
  prime: (key: K, value: V) => void;
}

export function createDataLoader<K, V>(
  batchFn: BatchFn<K, V>,
  options: DataLoaderOptions<K> = {},
): DataLoader<K, V> {
  const cacheKeyFn = options.cacheKeyFn ?? ((key: K): unknown => key);
  const scheduler = createBatchScheduler<K, V>(batchFn, {
    ...(options.scheduler ? { scheduler: options.scheduler } : {}),
    cacheKeyFn,
  });

  const cache = new Map<unknown, Promise<V>>();

  const load = (key: K): Promise<V> => {
    const ck = cacheKeyFn(key);
    const cached = cache.get(ck);
    if (cached !== undefined) return cached;

    const promise = scheduler.load(key);
    cache.set(ck, promise);
    // Do not cache failures — evict so a retry can re-batch. Only drop OUR entry.
    promise.catch(() => {
      if (cache.get(ck) === promise) cache.delete(ck);
    });
    return promise;
  };

  const loadMany = (keys: readonly K[]): Promise<(V | Error)[]> =>
    Promise.all(
      keys.map((key) =>
        load(key).then(
          (value): V | Error => value,
          (reason): V | Error =>
            reason instanceof Error ? reason : new Error(String(reason)),
        ),
      ),
    );

  const clear = (key: K): void => {
    cache.delete(cacheKeyFn(key));
  };

  const clearAll = (): void => {
    cache.clear();
  };

  const prime = (key: K, value: V): void => {
    const ck = cacheKeyFn(key);
    if (!cache.has(ck)) cache.set(ck, Promise.resolve(value));
  };

  return { load, loadMany, clear, clearAll, prime };
}
