/**
 * YOUR TURN — map over `items` with async `mapper`, running at most `concurrency` at once,
 * and return results in the SAME ORDER as the input (not completion order).
 * Hint: keep a pool of at most `concurrency` in-flight promises; write each result into its
 * original index. Return `Promise<R[]>`.
 */
export async function pMap<T, R>(
  _items: readonly T[],
  _mapper: (item: T, index: number) => Promise<R>,
  _opts: { concurrency: number },
): Promise<R[]> {
  throw new Error("TODO: bounded-concurrency map preserving input order");
}
