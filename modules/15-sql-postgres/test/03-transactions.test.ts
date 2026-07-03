import { Client } from "pg";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createBoardsSchema, createCards } from "../solution/01-schema.js";
import { moveCard } from "../solution/03-transactions.js";

let container: StartedPostgreSqlContainer;
let client: Client;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
});

afterAll(async () => {
  await client.end();
  await container.stop();
});

beforeEach(async () => {
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await createBoardsSchema(client);
  await createCards(client);
  await client.query("INSERT INTO boards (id, title) VALUES (1, 'Sprint')");
  // list 1 holds two cards, list 2 holds one — card_count seeded to match.
  await client.query(
    "INSERT INTO lists (id, board_id, title, position, card_count) VALUES (1, 1, 'Todo', 1, 2), (2, 1, 'Doing', 2, 1)",
  );
  await client.query(
    "INSERT INTO cards (id, list_id, title, position) VALUES (1, 1, 'c1', 1), (2, 1, 'c2', 2), (3, 2, 'c3', 1)",
  );
});

async function cardListId(id: number): Promise<number | undefined> {
  const res = await client.query<{ list_id: number }>(
    "SELECT list_id FROM cards WHERE id = $1",
    [id],
  );
  return res.rows[0]?.list_id;
}

async function listCount(id: number): Promise<number | undefined> {
  const res = await client.query<{ card_count: number }>(
    "SELECT card_count FROM lists WHERE id = $1",
    [id],
  );
  return res.rows[0]?.card_count;
}

describe("moveCard", () => {
  it("moves the card and rebalances both card_counts atomically", async () => {
    const result = await moveCard(client, { cardId: 1, toListId: 2 });

    expect(result).toEqual({ cardId: 1, fromListId: 1, toListId: 2 });
    expect(await cardListId(1)).toBe(2);
    expect(await listCount(1)).toBe(1); // 2 → 1
    expect(await listCount(2)).toBe(2); // 1 → 2
  });

  it("rolls back cleanly when the target list is missing — every row unchanged", async () => {
    await expect(moveCard(client, { cardId: 1, toListId: 999 })).rejects.toThrow(
      "target list 999 not found",
    );

    // Nothing moved, no count drifted: the source decrement was rolled back too.
    expect(await cardListId(1)).toBe(1);
    expect(await listCount(1)).toBe(2);
    expect(await listCount(2)).toBe(1);
  });

  it("rejects an unknown card without touching any list", async () => {
    await expect(moveCard(client, { cardId: 404, toListId: 2 })).rejects.toThrow(
      "card 404 not found",
    );

    expect(await listCount(1)).toBe(2);
    expect(await listCount(2)).toBe(1);
  });
});
