/**
 * The tick-batching core of a DataLoader, from scratch — no library. `load(key)` must NOT call the
 * batch function immediately; it queues the key and coalesces every key collected in the same tick
 * into ONE `batchFn` call.
 *
 * YOUR TURN — implement `createBatchScheduler`:
 *   - load(key): push { key, resolve, reject } onto a queue; the FIRST push in a tick schedules one
 *     dispatch via the injected `scheduler` (default `queueMicrotask`). Return the promise.
 *   - dispatch(): snapshot + reset the queue; build the DISTINCT keys (dedupe by `cacheKeyFn`,
 *     first-seen order) and remember each key's slot index; call `batchFn(distinctKeys)` ONCE.
 *   - map results back: resolve each caller with the value at ITS key's index; if that slot is an
 *     `Error` reject only that caller; if the returned array's length ≠ distinctKeys reject them all;
 *     if `batchFn` itself rejects, reject every caller with that reason.
 *   - loadMany(keys): settle each `load` to a value-or-Error (never reject the whole array).
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

export function createBatchScheduler<K, V>(
  _batchFn: BatchFn<K, V>,
  _options: BatchSchedulerOptions<K> = {},
): BatchScheduler<K, V> {
  throw new Error("TODO: queue keys per tick and dispatch one deduped batchFn call");
}
