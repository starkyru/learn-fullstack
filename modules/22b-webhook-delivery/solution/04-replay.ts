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
 * Replay a single delivery by id: re-attempt it via `transport`, bump `attempts`, and transition
 * the record. 2xx → `success`; otherwise `failed`, unless this attempt exhausts `maxAttempts`, in
 * which case it moves to `dead` (the DLQ). Writes the updated record back to the store and returns
 * it. Throws on an unknown id.
 */
export async function replay(
  id: string,
  store: DeliveryStore,
  transport: Transport,
): Promise<StoredDelivery> {
  const record = store.get(id);
  if (record === undefined) throw new Error(`Unknown delivery: ${id}`);

  let status: number;
  try {
    ({ status } = await transport(record.url, { body: record.body, headers: {} }));
  } catch {
    status = 0;
  }

  const attempts = record.attempts + 1;
  let next: DeliveryStatus;
  if (status >= 200 && status < 300) next = "success";
  else if (attempts >= record.maxAttempts) next = "dead";
  else next = "failed";

  const updated: StoredDelivery = { ...record, attempts, status: next };
  store.set(id, updated);
  return updated;
}

/** The dead-letter queue: every delivery that exhausted its attempts without succeeding. */
export function deadLetters(store: DeliveryStore): StoredDelivery[] {
  return [...store.values()].filter((d) => d.status === "dead");
}
