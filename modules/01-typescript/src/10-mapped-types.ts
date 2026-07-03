/**
 * YOUR TURN (🔴 from scratch) — a MAPPED type with TEMPLATE-LITERAL keys.
 * `Getters<T>` must turn `{ id: string; name: string }` into
 *   `{ getId: () => string; getName: () => string }`.
 * Steps: 1) map over `[K in keyof T ...]`
 *        2) REKEY each with `as \`get${Capitalize<string & K>}\``
 *        3) give each a value type `() => T[K]`.
 * Replace the placeholder below with the real mapped type.
 */
export type Getters<T> = Record<string, () => unknown>; // TODO: real mapped type

/**
 * YOUR TURN — build the accessor functions at runtime so the value matches `Getters<T>`.
 * Steps: 1) for each `key` of `obj`, capitalize the first letter
 *        2) set `out["get"+Cap] = () => obj[key]`  3) return it cast to `Getters<T>`.
 */
export function makeGetters<T extends object>(_obj: T): Getters<T> {
  throw new Error("TODO: build get<Key>() accessors that return obj[key]");
}
