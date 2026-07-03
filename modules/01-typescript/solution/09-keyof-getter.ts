export function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
