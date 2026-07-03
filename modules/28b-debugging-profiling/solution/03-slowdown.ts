/**
 * Profile a slowdown — the same result, computed two ways.
 *
 * `firstDuplicate` returns the first value that appears twice (the value at its SECOND occurrence).
 * The naive version is a hot O(n^2) path: for each element it re-scans everything before it. The
 * fast version is O(n): a `Set` of values already seen. Both return the identical answer — the
 * flame graph (see the README's clinic/0x notes) would show the naive path dominated by that inner
 * loop. Here we inject an operation counter so a test can PROVE the fast path does far fewer ops.
 *
 * The counter is injected (not read from a clock/global), so op counts are exact and deterministic.
 */

export interface OpCounter {
  ops: number;
}

/** O(n^2): for each element, scan every earlier element. Increments once per comparison. */
export function firstDuplicateNaive<T>(
  items: readonly T[],
  counter: OpCounter,
): T | undefined {
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < i; j++) {
      counter.ops++;
      if (Object.is(items[i], items[j])) return items[i];
    }
  }
  return undefined;
}

/** O(n): remember what we've seen in a Set. Increments once per element processed. */
export function firstDuplicateFast<T>(
  items: readonly T[],
  counter: OpCounter,
): T | undefined {
  const seen = new Set<T>();
  for (const item of items) {
    counter.ops++;
    if (seen.has(item)) return item;
    seen.add(item);
  }
  return undefined;
}

/**
 * A worst-case input for the naive path: `k` distinct values followed by a repeat of the FIRST
 * one, so nothing matches until the very last element. Length is `k + 1`.
 */
export function worstCaseInput(k: number): number[] {
  const rows: number[] = [];
  for (let i = 0; i < k; i++) rows.push(i);
  rows.push(0);
  return rows;
}
