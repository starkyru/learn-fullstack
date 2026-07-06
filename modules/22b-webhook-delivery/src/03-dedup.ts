/**
 * YOUR TURN (🟡) — at-least-once delivery means the same event WILL arrive twice.
 * Dedupe by idempotency key: skip events whose `id` is already in `seen`, and add each survivor
 * to `seen` so a later redelivery is dropped too. Mutate `seen` (the caller owns the persistent
 * set) and return only the fresh events, in input order.
 */
export function dedupe<E extends { id: string }>(
  _events: readonly E[],
  _seen: Set<string>,
): E[] {
  throw new Error("TODO: drop events whose id is already in `seen`; record survivors");
}

export interface SeqEvent {
  endpoint: string;
  seq: number;
}

export interface OrderedEndpoint<E> {
  ordered: E[];
  /** Sequence numbers missing between the lowest and highest seen (out-of-order / dropped). */
  gaps: number[];
}

/**
 * YOUR TURN (🟡) — group events per endpoint, sort each group by `seq`, and report gaps.
 * Steps:
 *   1. Bucket events into a `Map<endpoint, E[]>` (preserve first-seen endpoint order).
 *   2. For each bucket, `ordered` = a copy sorted by `seq` ascending.
 *   3. `gaps` = every integer strictly between consecutive `ordered[i].seq` and `ordered[i+1].seq`.
 *      A non-empty `gaps` means an event is late or lost.
 *   4. Return a `Map<endpoint, { ordered, gaps }>`.
 */
export function orderPerEndpoint<E extends SeqEvent>(
  _events: readonly E[],
): Map<string, OrderedEndpoint<E>> {
  throw new Error(
    "TODO: bucket by endpoint, sort by seq, compute missing sequence numbers",
  );
}
