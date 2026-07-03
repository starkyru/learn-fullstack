/**
 * Task 4 — Index & N+1 hunt.
 *
 * Two performance foot-guns, reproduced then fixed:
 *
 *  1. **N+1** — `loadBoardCardsN1` fetches the lists (1 query) then the cards of each list one by
 *     one (`N` queries). `loadBoardCardsBatched` returns byte-identical data in 2 queries by
 *     pulling every card with `WHERE list_id = ANY($ids)` and grouping in memory. A `QueryCounter`
 *     records the round-trips so a test can prove `2 < 1 + N`.
 *
 *  2. **Seq Scan → Index Scan** — with no index, `WHERE list_id = $1` scans every row. Add a
 *     B-tree on `list_id` and the planner switches. `explainCardsByList` returns the `EXPLAIN
 *     (ANALYZE)` plan text so a test can assert "Seq Scan" before and "Index Scan" after.
 *
 * This task owns a standalone schema (no FKs) so it can bulk-seed thousands of rows fast.
 */
import type { Client } from "pg";

export type QueryCounter = { count: number };

export type CardLite = { id: number; title: string };
export type ListWithCards = { listId: number; title: string; cards: CardLite[] };
export type BoardCards = ListWithCards[];

export type ListSeed = { id: number; title: string; cards: CardLite[] };
export type BoardSeed = { id: number; title: string; lists: ListSeed[] };

/** Standalone board/list/card schema — plain integer keys, no FKs, tuned for bulk seeding. */
export async function createN1Schema(client: Client): Promise<void> {
  await client.query(
    `CREATE TABLE boards (id integer PRIMARY KEY, title text NOT NULL);`,
  );
  await client.query(
    `CREATE TABLE lists (id integer PRIMARY KEY, board_id integer NOT NULL, title text NOT NULL);`,
  );
  await client.query(
    `CREATE TABLE cards (id integer PRIMARY KEY, list_id integer NOT NULL, title text NOT NULL);`,
  );
}

/** Deterministic nested seed for the N+1 demo. */
export async function seedBoard(client: Client, board: BoardSeed): Promise<void> {
  await client.query("INSERT INTO boards (id, title) VALUES ($1, $2)", [
    board.id,
    board.title,
  ]);
  for (const list of board.lists) {
    await client.query("INSERT INTO lists (id, board_id, title) VALUES ($1, $2, $3)", [
      list.id,
      board.id,
      list.title,
    ]);
    for (const card of list.cards) {
      await client.query("INSERT INTO cards (id, list_id, title) VALUES ($1, $2, $3)", [
        card.id,
        list.id,
        card.title,
      ]);
    }
  }
}

/** The N+1: 1 query for the lists, then 1 query PER list for its cards → `1 + N` round-trips. */
export async function loadBoardCardsN1(
  client: Client,
  boardId: number,
  counter: QueryCounter,
): Promise<BoardCards> {
  counter.count++;
  const listsRes = await client.query<{ id: number; title: string }>(
    "SELECT id, title FROM lists WHERE board_id = $1 ORDER BY id",
    [boardId],
  );

  const result: BoardCards = [];
  for (const list of listsRes.rows) {
    counter.count++;
    const cardsRes = await client.query<CardLite>(
      "SELECT id, title FROM cards WHERE list_id = $1 ORDER BY id",
      [list.id],
    );
    result.push({ listId: list.id, title: list.title, cards: cardsRes.rows });
  }
  return result;
}

/** The fix: 1 query for the lists, 1 batched query for every card → always 2 round-trips. */
export async function loadBoardCardsBatched(
  client: Client,
  boardId: number,
  counter: QueryCounter,
): Promise<BoardCards> {
  counter.count++;
  const listsRes = await client.query<{ id: number; title: string }>(
    "SELECT id, title FROM lists WHERE board_id = $1 ORDER BY id",
    [boardId],
  );
  const lists = listsRes.rows;
  const listIds = lists.map((list) => list.id);

  counter.count++;
  const cardsRes = await client.query<{ id: number; list_id: number; title: string }>(
    "SELECT id, list_id, title FROM cards WHERE list_id = ANY($1::int[]) ORDER BY id",
    [listIds],
  );

  const byList = new Map<number, CardLite[]>();
  for (const list of lists) byList.set(list.id, []);
  for (const card of cardsRes.rows) {
    const bucket = byList.get(card.list_id);
    if (bucket !== undefined) bucket.push({ id: card.id, title: card.title });
  }

  return lists.map((list) => ({
    listId: list.id,
    title: list.title,
    cards: byList.get(list.id) ?? [],
  }));
}

/**
 * Bulk-seed `cards` for the index demo: `total` rows spread across `lists` distinct `list_id`s.
 * `ANALYZE` refreshes the planner stats so `EXPLAIN` reflects the new row counts.
 */
export async function seedCardsBulk(
  client: Client,
  opts: { total: number; lists: number },
): Promise<void> {
  await client.query(
    `INSERT INTO cards (id, list_id, title)
       SELECT g, (g % $2) + 1, 'card ' || g
         FROM generate_series(1, $1) AS g`,
    [opts.total, opts.lists],
  );
  await client.query("ANALYZE cards");
}

/** Add the B-tree that turns the Seq Scan into an Index Scan, then refresh stats. */
export async function createCardsListIdIndex(client: Client): Promise<void> {
  await client.query("CREATE INDEX idx_cards_list_id ON cards (list_id)");
  await client.query("ANALYZE cards");
}

type PlanRow = { "QUERY PLAN": string };

/** Return the `EXPLAIN (ANALYZE)` plan text for a `WHERE list_id = $1` lookup. */
export async function explainCardsByList(
  client: Client,
  listId: number,
): Promise<string> {
  const res = await client.query<PlanRow>(
    "EXPLAIN (ANALYZE, FORMAT TEXT) SELECT id, list_id, title FROM cards WHERE list_id = $1",
    [listId],
  );
  return res.rows.map((row) => row["QUERY PLAN"]).join("\n");
}
