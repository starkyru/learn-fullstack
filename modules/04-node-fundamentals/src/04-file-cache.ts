/**
 * YOUR TURN — a tiny on-disk cache under `dir`, storing each entry as JSON `{ value, expiresAt }`.
 *  - `set(key, value, ttlMs)` writes the file with `expiresAt = Date.now() + ttlMs`.
 *  - `get(key)` returns the value if the file exists and is not expired, else `undefined`
 *    (delete the file when expired). Use `fs/promises` and `path.join(dir, key + ".json")`.
 */
export class FileCache {
  constructor(private readonly dir: string) {}
  async set(_key: string, _value: unknown, _ttlMs: number): Promise<void> {
    throw new Error("TODO: write { value, expiresAt } as JSON");
  }
  async get<T>(_key: string): Promise<T | undefined> {
    throw new Error("TODO: read the file; honor expiry");
  }
}
