import { Client } from "pg";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createBoardsSchema, createCards } from "../solution/01-schema.js";
import { boardView, keysetPageCards } from "../solution/02-joins.js";

let container: StartedPostgreSqlContainer;
let client: Client;

beforeAll(async () => {
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
  await createBoardsSchema(client);
  await createCards(client);
});

describe("boardView (3-table join)", () => {
  it("flattens boards ⋈ lists ⋈ cards ordered by list.position then card.position", async () => {
    await client.query("INSERT INTO boards (id, title) VALUES (1, 'Sprint')");
    await client.query(
      "INSERT INTO lists (id, board_id, title, position, card_count) VALUES (1, 1, 'Todo', 1, 2), (2, 1, 'Done', 2, 1)",
    );
    // Insert out of position order to prove the ORDER BY, not insertion order, decides output.
    await client.query(
      "INSERT INTO cards (id, list_id, title, position) VALUES (3, 2, 'C', 1), (2, 1, 'B', 2), (1, 1, 'A', 1)",
    );

    expect(await boardView(client, 1)).toEqual([
      {
        board_id: 1,
        board_title: "Sprint",
        list_id: 1,
        list_title: "Todo",
        card_id: 1,
        card_title: "A",
      },
      {
        board_id: 1,
        board_title: "Sprint",
        list_id: 1,
        list_title: "Todo",
        card_id: 2,
        card_title: "B",
      },
      {
        board_id: 1,
        board_title: "Sprint",
        list_id: 2,
        list_title: "Done",
        card_id: 3,
        card_title: "C",
      },
    ]);
  });

  it("returns no rows for a board with no cards", async () => {
    await client.query("INSERT INTO boards (id, title) VALUES (1, 'Empty')");
    await client.query(
      "INSERT INTO lists (id, board_id, title, position) VALUES (1, 1, 'Todo', 1)",
    );
    expect(await boardView(client, 1)).toEqual([]);
  });
});

describe("keysetPageCards", () => {
  beforeEach(async () => {
    await client.query("INSERT INTO boards (id, title) VALUES (1, 'B')");
    await client.query(
      "INSERT INTO lists (id, board_id, title, position) VALUES (1, 1, 'L', 1)",
    );
    await client.query(
      "INSERT INTO cards (id, list_id, title, position) VALUES (1, 1, 'c1', 1), (2, 1, 'c2', 2), (3, 1, 'c3', 3), (4, 1, 'c4', 4), (5, 1, 'c5', 5)",
    );
  });

  it("returns the first page in ascending id order", async () => {
    expect(await keysetPageCards(client, { afterId: 0, limit: 2 })).toEqual([
      { id: 1, list_id: 1, title: "c1", position: 1 },
      { id: 2, list_id: 1, title: "c2", position: 2 },
    ]);
  });

  it("walks to the next page using the last id as the cursor", async () => {
    expect(await keysetPageCards(client, { afterId: 2, limit: 2 })).toEqual([
      { id: 3, list_id: 1, title: "c3", position: 3 },
      { id: 4, list_id: 1, title: "c4", position: 4 },
    ]);
  });

  it("returns a partial last page and then nothing past the end", async () => {
    expect(await keysetPageCards(client, { afterId: 4, limit: 2 })).toEqual([
      { id: 5, list_id: 1, title: "c5", position: 5 },
    ]);
    expect(await keysetPageCards(client, { afterId: 5, limit: 2 })).toEqual([]);
  });
});

describe("keysetPageCards is stable under inserts between page fetches", () => {
  // Sparse ids leave a gap (15) below the page-1 boundary (20) so we can insert a row that sorts
  // BEFORE the cursor after page 1 has already been read.
  beforeEach(async () => {
    await client.query("INSERT INTO boards (id, title) VALUES (1, 'B')");
    await client.query(
      "INSERT INTO lists (id, board_id, title, position) VALUES (1, 1, 'L', 1)",
    );
    await client.query(
      "INSERT INTO cards (id, list_id, title, position) VALUES (10, 1, 'c10', 1), (20, 1, 'c20', 2), (30, 1, 'c30', 3), (40, 1, 'c40', 4), (50, 1, 'c50', 5)",
    );
  });

  it("skips no row and duplicates none when a card is inserted below the cursor mid-walk", async () => {
    // Page 1: first two ids ascending.
    const page1 = await keysetPageCards(client, { afterId: 0, limit: 2 });
    expect(page1.map((r) => r.id)).toEqual([10, 20]);

    // The cursor for page 2 is the last id of page 1.
    const cursor = page1[page1.length - 1]!.id;
    expect(cursor).toBe(20);

    // Insert a card that sorts BEFORE the page-2 boundary (id 15 < cursor 20). Under OFFSET paging
    // this shifts the window and would duplicate id 20 (or, if afterId is treated as an offset,
    // skip past the remaining rows). Keyset (WHERE id > cursor) is immune.
    await client.query(
      "INSERT INTO cards (id, list_id, title, position) VALUES (15, 1, 'c15', 6)",
    );

    // Page 2: keyset walk from the cursor.
    const page2 = await keysetPageCards(client, { afterId: cursor, limit: 2 });
    expect(page2.map((r) => r.id)).toEqual([30, 40]);

    // No row skipped or duplicated across the two pages: the id sequence is exactly [10, 20, 30, 40].
    const seen = [...page1, ...page2].map((r) => r.id);
    expect(seen).toEqual([10, 20, 30, 40]);
    expect(new Set(seen).size).toBe(seen.length); // no duplicates
  });
});
