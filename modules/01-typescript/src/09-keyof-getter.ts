/**
 * YOUR TURN — a fully-typed getter. `K extends keyof T` ties the key to the object, and the
 * return type `T[K]` (an *indexed access type*) means `getProp(user, "id")` is a `string`,
 * not `any`. Just return `obj[key]`.
 */
export function getProp<T, K extends keyof T>(_obj: T, _key: K): T[K] {
  throw new Error("TODO: return obj[key] (typed as T[K])");
}

/**
 * YOUR TURN — collect one field across a list. Return type is `T[K][]`.
 * Hint: `items.map(item => item[key])`.
 */
export function pluck<T, K extends keyof T>(_items: readonly T[], _key: K): T[K][] {
  throw new Error("TODO: map each item to item[key]");
}
