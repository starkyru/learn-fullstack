import { Client } from "pg";
import { describe, expect, it } from "vitest";
import { withEphemeralPostgres } from "./index.js";

describe("withEphemeralPostgres", () => {
  it("provisions a real, queryable Postgres and tears it down", async () => {
    let capturedUrl = "";
    const version = await withEphemeralPostgres(async (url) => {
      capturedUrl = url;
      const client = new Client({ connectionString: url });
      await client.connect();
      try {
        await client.query("CREATE TABLE t (id int primary key, name text)");
        await client.query("INSERT INTO t (id, name) VALUES ($1, $2)", [1, "alice"]);
        const res = await client.query<{ id: number; name: string }>(
          "SELECT id, name FROM t WHERE id = $1",
          [1],
        );
        // Exact round-trip through a real engine — proves it's queryable Postgres, not a stub.
        expect(res.rows).toEqual([{ id: 1, name: "alice" }]);
        const v = await client.query<{ server_version_num: string }>(
          "SHOW server_version_num",
        );
        return v.rows[0]?.server_version_num ?? "";
      } finally {
        await client.end();
      }
    });

    expect(capturedUrl).toMatch(/^postgres(ql)?:\/\//);
    // postgres:16 → server_version_num is 16xxxx.
    expect(Number(version)).toBeGreaterThanOrEqual(160000);

    // After the helper resolves the container is stopped: a fresh connection to the old URL fails.
    const stale = new Client({ connectionString: capturedUrl });
    await expect(stale.connect()).rejects.toThrow();
  }, 120_000);
});
