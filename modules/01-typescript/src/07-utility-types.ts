export type User = { id: string; name: string; email: string };

/**
 * YOUR TURN — merge a partial patch onto a base object; the patch's fields win. This is the
 * canonical use of `Partial<T>` (every field optional). No `any`.
 * Signature: <T>(base: T, patch: Partial<T>) => T. Hint: spread base then patch.
 */
export function applyPatch<T extends object>(_base: T, _patch: Partial<T>): T {
  throw new Error("TODO: return a merged object with patch overriding base");
}

/**
 * YOUR TURN — build a lookup keyed by each item's `id`, typed `Record<string, T>`.
 * Steps: 1) start with `{}` typed as `Record<string, T>`  2) set `out[item.id] = item`.
 */
export function indexById<T extends { id: string }>(
  _items: readonly T[],
): Record<string, T> {
  throw new Error("TODO: return a lookup object keyed by item.id");
}
