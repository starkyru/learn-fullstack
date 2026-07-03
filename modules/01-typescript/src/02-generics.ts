/** A typed result: either a value or an error, never both. */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

/**
 * YOUR TURN — construct the two Result variants.
 *   ok(value)  -> { ok: true, value }
 *   err(error) -> { ok: false, error }
 * Keep them generic so the value/error types are preserved.
 */
export function ok<T>(_value: T): Result<T, never> {
  throw new Error("TODO: return the success Result");
}
export function err<E>(_error: E): Result<never, E> {
  throw new Error("TODO: return the failure Result");
}

/**
 * YOUR TURN — return a new object with only `keys` copied from `obj`.
 * The return type must be `Pick<T, K>` (no `any`, no assertions that widen).
 * Hint: you'll need an accumulator typed as `Pick<T, K>` and to copy by key.
 */
export function pick<T extends object, K extends keyof T>(
  _obj: T,
  _keys: readonly K[],
): Pick<T, K> {
  throw new Error("TODO: implement a typed pick");
}
