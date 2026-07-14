import { Client } from "pg";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createCardsListIdIndex,
  createN1Schema,
  explainCardsByList,
  loadBoardCardsBatched,
  loadBoardCardsN1,
  seedBoard,
  seedCardsBulk,
  type BoardCards,
  type QueryCounter,
} from "../solution/04-index-n1.js";
import { hasDocker } from "@learn-fullstack/testing";

// Skip the container-backed suite when no Docker daemon is reachable (CI always has one).
const dockerUp = hasDocker();

let container: StartedPostgreSqlContainer;
let client: Client;

/**
 * Wrap a real pg Client so every `.query(...)` call is counted at the TRUE boundary before it
 * is delegated to the real client. The loaders talk to `spied` exactly as they would to the real
 * client, so `spy.calls` is the number of real round-trips issued — not a value the loader
 * self-reports. Every other method/property is forwarded to the real client unchanged.
 */
function makeQuerySpy(real: Client): { spied: Client; spy: { calls: number } } {
  const spy = { calls: 0 };
  const spied = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === "query") {
        return (...args: unknown[]) => {
          spy.calls++;
          return (target.query as (...a: unknown[]) => unknown)(...args);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  }) as unknown as Client;
  return { spied, spy };
}

beforeAll(async () => {
  if (!dockerUp) return;
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
});

afterAll(async () => {
  await client?.end();
  await container?.stop();
});

beforeEach(async () => {
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await createN1Schema(client);
});

describe.skipIf(!dockerUp)("N+1 vs batched loader", () => {
  const expected: BoardCards = [
    {
      listId: 1,
      title: "L1",
      cards: [
        { id: 1, title: "c1" },
        { id: 2, title: "c2" },
      ],
    },
    { listId: 2, title: "L2", cards: [{ id: 3, title: "c3" }] },
    { listId: 3, title: "L3", cards: [] },
  ];

  beforeEach(async () => {
    await seedBoard(client, {
      id: 1,
      title: "Board",
      lists: [
        {
          id: 1,
          title: "L1",
          cards: [
            { id: 1, title: "c1" },
            { id: 2, title: "c2" },
          ],
        },
        { id: 2, title: "L2", cards: [{ id: 3, title: "c3" }] },
        { id: 3, title: "L3", cards: [] },
      ],
    });
  });

  // The counter param is IGNORED here on purpose: it is self-reported by the loader and a batched
  // loader that secretly issues N real queries could still increment it twice. We instead count the
  // real round-trips by spying on the injected client's `.query` at the pg boundary.
  const ignoredCounter: QueryCounter = { count: 0 };

  it("the N+1 loader issues 1 + N REAL client.query round-trips (1 lists + 3 per-list)", async () => {
    const { spied, spy } = makeQuerySpy(client);
    const result = await loadBoardCardsN1(spied, 1, ignoredCounter);

    expect(result).toEqual(expected);
    expect(spy.calls).toBe(4); // 1 for lists + 3 per-list cards, counted at client.query
  });

  it("the batched loader returns identical data in exactly 2 REAL client.query round-trips", async () => {
    const { spied, spy } = makeQuerySpy(client);
    const result = await loadBoardCardsBatched(spied, 1, ignoredCounter);

    expect(result).toEqual(expected);
    expect(spy.calls).toBe(2); // 1 for lists + 1 batched ANY($1::int[]), counted at client.query
  });

  it("both loaders agree row-for-row", async () => {
    const n1 = await loadBoardCardsN1(client, 1, { count: 0 });
    const batched = await loadBoardCardsBatched(client, 1, { count: 0 });
    expect(batched).toEqual(n1);
  });
});

describe.skipIf(!dockerUp)("index flips the query plan", () => {
  beforeEach(async () => {
    // 5000 cards across 500 list_ids → ~10 rows per list_id: selective enough for an index scan.
    await seedCardsBulk(client, { total: 5000, lists: 500 });
  });

  it("EXPLAIN shows a Seq Scan before the index and an Index Scan after", async () => {
    // BEFORE: with no index on list_id, a Seq Scan is the planner's ONLY option — deterministic.
    const before = await explainCardsByList(client, 1);
    expect(before).toContain("Seq Scan");
    expect(before).not.toContain("Index Scan");

    await createCardsListIdIndex(client);

    // AFTER: on a small table the planner may still prefer a Seq Scan by cost heuristics, making
    // the flip flaky. Penalize seq scans for THIS session so the index is chosen deterministically
    // WHEN one exists. If the index is missing (e.g. CREATE INDEX dropped), the planner is forced
    // back to a Seq Scan anyway — so this assertion still fails without the index.
    await client.query("SET enable_seqscan = off");
    try {
      const after = await explainCardsByList(client, 1);
      expect(after).toContain("Index Scan"); // matches "Index Scan" and "Bitmap Index Scan"
      expect(after).not.toContain("Seq Scan");
    } finally {
      await client.query("SET enable_seqscan = on");
    }
  });
});
