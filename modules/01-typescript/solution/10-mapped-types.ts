export type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

export function makeGetters<T extends object>(obj: T): Getters<T> {
  const out = {} as Record<string, () => unknown>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const name = String(key);
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    out[`get${cap}`] = () => obj[key];
  }
  return out as Getters<T>;
}
