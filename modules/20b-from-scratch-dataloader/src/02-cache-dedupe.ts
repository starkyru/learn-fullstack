import type { BatchFn, Scheduler } from "./01-batch-scheduler.js";

/**
 * The cache + dedupe layer on top of the tick batcher (01) — the full `createDataLoader` contract.
 * It may build on `createBatchScheduler` from 01.
 *
 * YOUR TURN — implement `createDataLoader`:
 *   - keep a `Map<cacheKeyFn(key), Promise<V>>`.
 *   - load(key): return the cached promise if present; else enqueue on the batch scheduler, cache the
 *     returned promise, and return it. A promise that REJECTS must be evicted (only if it's still the
 *     cached one) so a later load retries; successful values stay cached.
 *   - loadMany(keys): settle each `load` to a value-or-Error.
 *   - clear(key) / clearAll(): evict one / all.
 *   - prime(key, value): seed `Promise.resolve(value)` WITHOUT calling batchFn, and never overwrite
 *     an existing entry.
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
  _batchFn: BatchFn<K, V>,
  _options: DataLoaderOptions<K> = {},
): DataLoader<K, V> {
  throw new Error(
    "TODO: memoize by key over the batch scheduler; add clear/clearAll/prime",
  );
}
