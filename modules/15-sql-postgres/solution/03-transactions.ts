/**
 * Task 3 — Transactions.
 *
 * `moveCard` moves a card to another list AND rebalances both lists' denormalized `card_count` —
 * three writes that must all land or none. It runs inside `BEGIN … COMMIT`; any failure hits the
 * `catch`, `ROLLBACK`s, and rethrows, leaving every row byte-for-byte unchanged.
 *
 * The atomicity proof lives in the ORDER of the writes: we decrement the source count FIRST, then
 * try to bump the target. A missing target list updates zero rows → we throw → the already-applied
 * decrement is rolled back. `SELECT … FOR UPDATE` locks the card row for the duration.
 */
import type { Client } from "pg";

export type MoveCardOpts = { cardId: number; toListId: number };
export type MoveResult = { cardId: number; fromListId: number; toListId: number };

type CardLocator = { id: number; list_id: number };

export async function moveCard(client: Client, opts: MoveCardOpts): Promise<MoveResult> {
  try {
    await client.query("BEGIN");

    // Lock the card and learn its current list.
    const found = await client.query<CardLocator>(
      "SELECT id, list_id FROM cards WHERE id = $1 FOR UPDATE",
      [opts.cardId],
    );
    const card = found.rows[0];
    if (card === undefined) {
      throw new Error(`card ${opts.cardId} not found`);
    }

    // Write #1: source list loses a card.
    await client.query("UPDATE lists SET card_count = card_count - 1 WHERE id = $1", [
      card.list_id,
    ]);

    // Write #2: target list gains one — zero rows means the list doesn't exist, so we bail and
    // let ROLLBACK undo write #1.
    const bumped = await client.query(
      "UPDATE lists SET card_count = card_count + 1 WHERE id = $1",
      [opts.toListId],
    );
    if ((bumped.rowCount ?? 0) === 0) {
      throw new Error(`target list ${opts.toListId} not found`);
    }

    // Write #3: the card itself moves.
    await client.query("UPDATE cards SET list_id = $1 WHERE id = $2", [
      opts.toListId,
      opts.cardId,
    ]);

    await client.query("COMMIT");
    return { cardId: opts.cardId, fromListId: card.list_id, toListId: opts.toListId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}
