import type { Transport } from "./02-deliver.js";

export type DeliveryStatus = "pending" | "success" | "failed" | "dead";

export interface StoredDelivery {
  id: string;
  url: string;
  body: string;
  attempts: number;
  maxAttempts: number;
  status: DeliveryStatus;
}

/** The delivery log / DLQ backing store, keyed by delivery id. */
export type DeliveryStore = Map<string, StoredDelivery>;

/**
 * YOUR TURN (🔴 from scratch) — build the replay engine. NO queue/webhook library
 * (no `bullmq`, no `svix`, no Stripe SDK). Just the store + these two functions.
 * `replay`:
 *   1. Look up the record by `id`; throw `Error("Unknown delivery: <id>")` if absent.
 *   2. Re-attempt via `transport` (a thrown error → status `0`).
 *   3. `attempts = record.attempts + 1`.
 *   4. 2xx → `success`. Else if `attempts >= maxAttempts` → `dead` (the DLQ). Else → `failed`.
 *   5. Write the updated record back into the store and return it.
 */
export async function replay(
  _id: string,
  _store: DeliveryStore,
  _transport: Transport,
): Promise<StoredDelivery> {
  throw new Error(
    "TODO: re-attempt by id, bump attempts, transition to success/failed/dead",
  );
}

/**
 * YOUR TURN (🔴) — the dead-letter queue: every delivery whose status is `dead`.
 */
export function deadLetters(_store: DeliveryStore): StoredDelivery[] {
  throw new Error("TODO: return every stored delivery with status 'dead'");
}
