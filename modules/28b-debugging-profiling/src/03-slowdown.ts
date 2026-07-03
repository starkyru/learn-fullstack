/**
 * Profile a slowdown — the same result, computed two ways.
 *
 * `firstDuplicate` returns the first value that appears twice (the value at its SECOND occurrence).
 * You will write a hot O(n^2) version and an O(n) version that return the identical answer, then a
 * test proves — via an injected operation counter — that the fast path does far fewer ops. The
 * counter is injected (not a clock/global) so op counts stay exact and deterministic.
 */

export interface OpCounter {
  ops: number;
}

/**
 * YOUR TURN — the O(n^2) baseline. For each element, scan every EARLIER element; increment
 * `counter.ops` once per comparison; return the first value equal to an earlier one.
 */
export function firstDuplicateNaive<T>(
  _items: readonly T[],
  _counter: OpCounter,
): T | undefined {
  throw new Error(
    "TODO: double loop; count each comparison; return the first repeated value",
  );
}

/**
 * YOUR TURN — the O(n) fix. Track seen values in a `Set`; increment `counter.ops` once per element
 * processed; return the first value already in the set. Must return the SAME answer as the naive
 * version for every input.
 */
export function firstDuplicateFast<T>(
  _items: readonly T[],
  _counter: OpCounter,
): T | undefined {
  throw new Error(
    "TODO: one pass with a Set; count each element; return the first repeat",
  );
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
