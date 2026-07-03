import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface Entry {
  value: unknown;
  expiresAt: number;
}

export class FileCache {
  constructor(private readonly dir: string) {}

  // Encode the key so separators / ".." can never escape the cache dir (path traversal).
  private file(key: string): string {
    return join(this.dir, `${encodeURIComponent(key)}.json`);
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const entry: Entry = { value, expiresAt: Date.now() + ttlMs };
    await writeFile(this.file(key), JSON.stringify(entry), "utf8");
  }

  async get<T>(key: string): Promise<T | undefined> {
    let raw: string;
    try {
      raw = await readFile(this.file(key), "utf8");
    } catch {
      return undefined;
    }
    let entry: Entry;
    try {
      entry = JSON.parse(raw) as Entry;
    } catch {
      await rm(this.file(key), { force: true }); // drop a corrupt entry, don't throw
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      await rm(this.file(key), { force: true });
      return undefined;
    }
    return entry.value as T;
  }
}
