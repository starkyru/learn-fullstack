/**
 * Task 4 — Index & N+1 hunt (FROM SCRATCH).
 *
 * Build a standalone board/list/card schema (plain integer keys, no FKs, so you can bulk-seed
 * thousands of rows) and both performance demos:
 *
 *  1. **N+1 vs batched.** `loadBoardCardsN1` fetches the lists (1 query) then the cards of each
 *     list one-by-one (`N` queries); `loadBoardCardsBatched` returns byte-identical data in 2
 *     queries via `WHERE list_id = ANY($ids)` + in-memory grouping. Both bump `counter.count` once
 *     per round-trip so a test can prove `2 < 1 + N`.
 *  2. **Seq Scan → Index Scan.** `explainCardsByList` returns the `EXPLAIN (ANALYZE)` plan text;
 *     `createCardsListIdIndex` adds the B-tree that flips the plan. `ANALYZE` after seeding/indexing
 *     so the planner has fresh stats.
 *
 * Keep every signature and return shape below; implement all seven bodies.
 */
import type { Client } from "pg";

export type QueryCounter = { count: number };

export type CardLite = { id: number; title: string };
export type ListWithCards = { listId: number; title: string; cards: CardLite[] };
export type BoardCards = ListWithCards[];

export type ListSeed = { id: number; title: string; cards: CardLite[] };
export type BoardSeed = { id: number; title: string; lists: ListSeed[] };

export async function createN1Schema(_client: Client): Promise<void> {
  throw new Error("TODO: create standalone boards/lists/cards tables (no FKs)");
}

export async function seedBoard(_client: Client, _board: BoardSeed): Promise<void> {
  throw new Error("TODO: deterministic nested seed for the N+1 demo");
}

export async function loadBoardCardsN1(
  _client: Client,
  _boardId: number,
  _counter: QueryCounter,
): Promise<BoardCards> {
  throw new Error(
    "TODO: the N+1 — 1 query for lists, then 1 query PER list for its cards",
  );
}

export async function loadBoardCardsBatched(
  _client: Client,
  _boardId: number,
  _counter: QueryCounter,
): Promise<BoardCards> {
  throw new Error(
    "TODO: the fix — 1 query for lists, 1 batched WHERE list_id = ANY($1) for cards",
  );
}

export async function seedCardsBulk(
  _client: Client,
  _opts: { total: number; lists: number },
): Promise<void> {
  throw new Error("TODO: bulk-seed cards via generate_series, then ANALYZE cards");
}

export async function createCardsListIdIndex(_client: Client): Promise<void> {
  throw new Error("TODO: CREATE INDEX on cards(list_id), then ANALYZE cards");
}

export async function explainCardsByList(
  _client: Client,
  _listId: number,
): Promise<string> {
  throw new Error("TODO: return the EXPLAIN (ANALYZE) plan text for WHERE list_id = $1");
}
