/**
 * The tick-batching core of a DataLoader, from scratch — no library. `load(key)` does NOT call the
 * batch function immediately; it pushes the key onto a queue and (the first time the queue fills in a
 * given tick) schedules a single dispatch. When the dispatch runs, EVERY key collected during that
 * tick is coalesced into ONE `batchFn` call.
 *
 *   - The dispatch is scheduled through an injectable `scheduler` (default `queueMicrotask`) so tests
 *     can drive the clock deterministically instead of racing real microtasks.
 *   - The batch is dispatched with the DISTINCT keys (deduped by `cacheKeyFn`, first-seen order kept),
 *     so if two callers ask for the same key in one tick the backend sees it once. Each caller's
 *     promise resolves to the value at ITS key's index in the distinct list.
 *   - A slot that is an `Error` rejects only that caller; a `batchFn` result whose length does not
 *     match the distinct keys rejects every caller in the batch.
 */

export type BatchFn<K, V> = (keys: readonly K[]) => Promise<(V | Error)[]>;

export type Scheduler = (callback: () => void) => void;

export interface BatchSchedulerOptions<K> {
  /** How the per-tick dispatch is queued. Defaults to `queueMicrotask`; inject a fake in tests. */
  scheduler?: Scheduler;
  /** Groups keys into distinct batch slots. Defaults to identity (good for primitive keys). */
  cacheKeyFn?: (key: K) => unknown;
}

export interface BatchScheduler<K, V> {
  /** Enqueue a key; resolves to its value once the tick's batch settles. */
  load: (key: K) => Promise<V>;
  /** Enqueue many keys; settles to a value-or-Error per key (never rejects as a whole). */
  loadMany: (keys: readonly K[]) => Promise<(V | Error)[]>;
}

interface QueueItem<K, V> {
  key: K;
  resolve: (value: V) => void;
  reject: (reason: unknown) => void;
}

const defaultScheduler: Scheduler = (callback) => {
  queueMicrotask(callback);
};

export function createBatchScheduler<K, V>(
  batchFn: BatchFn<K, V>,
  options: BatchSchedulerOptions<K> = {},
): BatchScheduler<K, V> {
  const scheduler = options.scheduler ?? defaultScheduler;
  const cacheKeyFn = options.cacheKeyFn ?? ((key: K): unknown => key);

  let queue: QueueItem<K, V>[] = [];
  let scheduled = false;

  const dispatch = (): void => {
    // Take the current tick's items and reset for the next tick.
    const batch = queue;
    queue = [];
    scheduled = false;

    // Build the distinct key list (first-seen order) and remember each key's slot index.
    const distinctKeys: K[] = [];
    const indexByCacheKey = new Map<unknown, number>();
    for (const item of batch) {
      const ck = cacheKeyFn(item.key);
      if (!indexByCacheKey.has(ck)) {
        indexByCacheKey.set(ck, distinctKeys.length);
        distinctKeys.push(item.key);
      }
    }

    Promise.resolve(batchFn(distinctKeys)).then(
      (values) => {
        if (!Array.isArray(values) || values.length !== distinctKeys.length) {
          const got = Array.isArray(values) ? values.length : typeof values;
          const error = new Error(
            `batchFn must return an array of length ${distinctKeys.length}, got ${got}`,
          );
          for (const item of batch) item.reject(error);
          return;
        }
        for (const item of batch) {
          const idx = indexByCacheKey.get(cacheKeyFn(item.key));
          if (idx === undefined) {
            item.reject(new Error("internal: key was not batched"));
            continue;
          }
          const value = values[idx];
          if (value instanceof Error) item.reject(value);
          else item.resolve(value as V);
        }
      },
      (reason) => {
        // The whole batch failed — reject every caller with the same reason.
        for (const item of batch) item.reject(reason);
      },
    );
  };

  const load = (key: K): Promise<V> =>
    new Promise<V>((resolve, reject) => {
      queue.push({ key, resolve, reject });
      if (!scheduled) {
        scheduled = true;
        scheduler(dispatch);
      }
    });

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

  return { load, loadMany };
}
