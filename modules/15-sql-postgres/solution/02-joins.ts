/**
 * Task 2 — Joins & pagination.
 *
 * `keysetPageCards` pages `cards` by id (keyset, not OFFSET): `WHERE id > $after ORDER BY id
 * LIMIT $n`. `boardView` is the flattened 3-table join `boards ⋈ lists ⋈ cards`, ordered so the
 * rows read top-to-bottom exactly as the board renders.
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

/**
 * Keyset pagination: return the next `limit` cards whose id is strictly greater than `afterId`,
 * in ascending id order. Start a walk with `afterId: 0`; feed the last row's id back for page 2.
 */
export async function keysetPageCards(
  client: Client,
  opts: KeysetOpts,
): Promise<CardRow[]> {
  const res = await client.query<CardRow>(
    "SELECT id, list_id, title, position FROM cards WHERE id > $1 ORDER BY id ASC LIMIT $2",
    [opts.afterId, opts.limit],
  );
  return res.rows;
}

/**
 * The board view: one row per card, carrying its list and board, ordered by `list.position`
 * then `card.position` so the flattened result mirrors the on-screen board.
 */
export async function boardView(
  client: Client,
  boardId: number,
): Promise<BoardViewRow[]> {
  const res = await client.query<BoardViewRow>(
    `SELECT b.id    AS board_id,
            b.title AS board_title,
            l.id    AS list_id,
            l.title AS list_title,
            c.id    AS card_id,
            c.title AS card_title
       FROM boards b
       JOIN lists  l ON l.board_id = b.id
       JOIN cards  c ON c.list_id  = l.id
      WHERE b.id = $1
      ORDER BY l.position, c.position`,
    [boardId],
  );
  return res.rows;
}
