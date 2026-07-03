/**
 * WORKED EXAMPLE — a *type predicate* (`x is T`) teaches the compiler to narrow. After
 * `filter(isDefined)`, the result type drops `null | undefined`, so `compact` returns `T[]`.
 */
export function isDefined<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

export function compact<T>(items: readonly (T | null | undefined)[]): T[] {
  return items.filter(isDefined);
}

/**
 * YOUR TURN (analog) — a predicate that narrows `unknown` to `string`. Return `true` only
 * for strings so callers can safely treat the value as a `string` afterward.
 * Hint: `typeof x === "string"`. The return TYPE must stay `x is string`.
 */
export function isString(_x: unknown): _x is string {
  throw new Error("TODO: return typeof x === 'string'");
}
