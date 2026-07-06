/**
 * At-least-once delivery means a consumer WILL see the same event twice. Dedupe by idempotency
 * key: drop events whose id is already in `seen`, and record the survivors so a later redelivery
 * is dropped too. Mutates `seen` (the caller owns the persistent set).
 */
export function dedupe<E extends { id: string }>(
  events: readonly E[],
  seen: Set<string>,
): E[] {
  const out: E[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    out.push(event);
  }
  return out;
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
 * Group events per endpoint, sort each group by `seq` (events arrive out of order), and report
 * gaps — missing sequence numbers between the min and max seen. A non-empty `gaps` means an event
 * is late or lost, so the endpoint's stream is not yet safe to process in order.
 */
export function orderPerEndpoint<E extends SeqEvent>(
  events: readonly E[],
): Map<string, OrderedEndpoint<E>> {
  const byEndpoint = new Map<string, E[]>();
  for (const event of events) {
    const group = byEndpoint.get(event.endpoint) ?? [];
    group.push(event);
    byEndpoint.set(event.endpoint, group);
  }

  const result = new Map<string, OrderedEndpoint<E>>();
  for (const [endpoint, group] of byEndpoint) {
    const ordered = [...group].sort((a, b) => a.seq - b.seq);
    const gaps: number[] = [];
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let s = ordered[i]!.seq + 1; s < ordered[i + 1]!.seq; s++) gaps.push(s);
    }
    result.set(endpoint, { ordered, gaps });
  }
  return result;
}
