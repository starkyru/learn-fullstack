import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileCache } from "../solution/04-file-cache.js";

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "lfs-cache-"));
}

describe("FileCache", () => {
  it("returns a fresh value within its TTL", async () => {
    const cache = new FileCache(await tempDir());
    await cache.set("k", { n: 1 }, 1000);
    expect(await cache.get("k")).toEqual({ n: 1 });
  });

  it("returns undefined after the TTL elapses", async () => {
    const cache = new FileCache(await tempDir());
    await cache.set("k", "v", 5);
    await new Promise((r) => setTimeout(r, 20));
    expect(await cache.get("k")).toBeUndefined();
  });

  it("returns undefined for a missing key", async () => {
    const cache = new FileCache(await tempDir());
    expect(await cache.get("absent")).toBeUndefined();
  });

  it("keeps a traversal key inside the cache dir", async () => {
    const dir = await tempDir();
    const cache = new FileCache(dir);
    await cache.set("../escape", "v", 1000);
    // The only file written must live inside `dir`, not the parent.
    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    expect(await cache.get("../escape")).toBe("v");
  });

  it("returns undefined (not a throw) for a corrupt cache file", async () => {
    const dir = await tempDir();
    const cache = new FileCache(dir);
    await writeFile(join(dir, `${encodeURIComponent("bad")}.json`), "{not json", "utf8");
    await expect(cache.get("bad")).resolves.toBeUndefined();
  });
});
