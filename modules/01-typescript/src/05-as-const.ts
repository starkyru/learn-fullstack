/**
 * WORKED EXAMPLE — `as const` makes the array readonly and each element a *literal* type,
 * so `LogLevel` is the union "debug" | "info" | "warn" | "error", not `string`.
 */
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export function indexOfLevel(level: LogLevel): number {
  return LOG_LEVELS.indexOf(level);
}

/**
 * YOUR TURN (analog) — const-assert `PRIORITIES` so `Priority` is the union
 * "low" | "medium" | "high" (NOT `string`), then return a 1-based rank (low → 1, high → 3).
 * Steps: 1) add `as const` to the array literal below
 *        2) derive `Priority` via `(typeof PRIORITIES)[number]`
 *        3) return the element's index + 1.
 */
export const PRIORITIES = ["low", "medium", "high"];
export type Priority = string; // TODO: derive from PRIORITIES via `as const`

export function rankOf(_priority: Priority): number {
  throw new Error("TODO: const-assert PRIORITIES and return its 1-based rank");
}
