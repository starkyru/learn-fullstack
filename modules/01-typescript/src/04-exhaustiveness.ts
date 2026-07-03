import type { Shape } from "./01-narrowing.js";

/**
 * YOUR TURN (🔴 from scratch) — the compile-time exhaustiveness guard.
 * `assertNever` accepts a value the compiler has proven can only be `never` (every case
 * handled). If a new `Shape` variant is added and a switch forgets it, the leftover value
 * is no longer `never` and this call becomes a COMPILE error — that is the whole point.
 * At runtime it should throw an `Error` whose message starts with `Unhandled variant:` and
 * includes the offending `value` (serialize it) so a leaked case is diagnosable.
 * Return type is `never`.
 */
export function assertNever(_value: never): never {
  throw new Error("TODO: throw an `Unhandled variant:` error that includes the value");
}

/**
 * YOUR TURN — return the corner count per shape using an EXHAUSTIVE switch whose
 * `default:` calls `assertNever(shape)`. (circle → 0, rect → 4, square → 4.)
 * Because of the default, forgetting a future variant won't compile.
 */
export function corners(_shape: Shape): number {
  throw new Error("TODO: exhaustive switch on shape.kind with an assertNever default");
}
