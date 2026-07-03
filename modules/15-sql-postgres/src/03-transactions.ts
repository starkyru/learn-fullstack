/**
 * Task 3 — Transactions (TODO).
 *
 * Implement `moveCard` so it moves a card to another list AND rebalances both lists' denormalized
 * `card_count` — three writes that must all land or none. Wrap them in `BEGIN … COMMIT`; on any
 * error `ROLLBACK` and rethrow so every row is left byte-for-byte unchanged.
 *
 * Suggested order (this is what makes rollback observable):
 *   1. `BEGIN`.
 *   2. `SELECT id, list_id FROM cards WHERE id = $1 FOR UPDATE` — throw if the card is missing.
 *   3. `UPDATE lists SET card_count = card_count - 1 WHERE id = <source>`.
 *   4. `UPDATE lists SET card_count = card_count + 1 WHERE id = <target>` — if `rowCount === 0`
 *      the target doesn't exist, so throw (and let ROLLBACK undo step 3).
 *   5. `UPDATE cards SET list_id = <target> WHERE id = <card>`.
 *   6. `COMMIT`; return `{ cardId, fromListId, toListId }`.
 *   On `catch`: `ROLLBACK`, then rethrow.
 */
import type { Client } from "pg";

export type MoveCardOpts = { cardId: number; toListId: number };
export type MoveResult = { cardId: number; fromListId: number; toListId: number };

export async function moveCard(
  _client: Client,
  _opts: MoveCardOpts,
): Promise<MoveResult> {
  throw new Error("TODO: atomic move-card inside BEGIN…COMMIT with ROLLBACK on failure");
}
