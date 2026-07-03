export function isDefined<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

export function compact<T>(items: readonly (T | null | undefined)[]): T[] {
  return items.filter(isDefined);
}

export function isString(x: unknown): x is string {
  return typeof x === "string";
}
