/**
 * Task 2 — Joins & pagination (TODO).
 *
 * Implement both bodies; keep the signatures and return shapes.
 *
 *  - `keysetPageCards`: return the next `limit` cards whose id is strictly greater than
 *    `opts.afterId`, in ascending id order — `WHERE id > $1 ORDER BY id ASC LIMIT $2`. Keyset, not
 *    OFFSET, so page N costs the same as page 1.
 *  - `boardView`: the 3-table join `boards ⋈ lists ⋈ cards` for one board, one row per card,
 *    aliased to `board_id/board_title/list_id/list_title/card_id/card_title` and ordered by
 *    `l.position, c.position`.
 */
import type { Client } from "pg";

export type CardRow = { id: number; list_id: number; title: string; position: number };
export type KeysetOpts = { afterId: number; limit: number };

export type BoardViewRow = {
  board_id: number;
  board_title: string;
  list_id: number;
  list_title: string;
  card_id: number;
  card_title: string;
};

export async function keysetPageCards(
  _client: Client,
  _opts: KeysetOpts,
): Promise<CardRow[]> {
  throw new Error("TODO: keyset pagination — WHERE id > $1 ORDER BY id ASC LIMIT $2");
}

export async function boardView(
  _client: Client,
  _boardId: number,
): Promise<BoardViewRow[]> {
  throw new Error(
    "TODO: 3-table join boards ⋈ lists ⋈ cards, ORDER BY l.position, c.position",
  );
}
