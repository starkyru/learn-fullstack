export interface Transport {
  (
    url: string,
    opts: { body: string; headers: Record<string, string> },
  ): Promise<{
    status: number;
  }>;
}

export interface DeliveryResult {
  ok: boolean;
  attempts: number;
  /** The status code seen on each attempt, in order (0 = transport threw / network error). */
  statuses: number[];
}

export interface DeliverOptions {
  transport: Transport;
  /** Injected so tests never wait on real timers; production passes a real `setTimeout` wrapper. */
  sleep: (ms: number) => Promise<void>;
  maxAttempts?: number;
  baseDelayMs?: number;
  headers?: Record<string, string>;
}

/**
 * YOUR TURN (🟡) — deliver a webhook with bounded retries + exponential backoff.
 * Steps:
 *   1. Loop `attempt` from 1 to `maxAttempts` (default 5).
 *   2. Call `transport`; on a thrown error treat the status as `0` (network). Push each status.
 *   3. 2xx → return `{ ok: true, attempts, statuses }`.
 *   4. Retry ONLY transient failures — status `0`, `429`, or `>= 500`. A permanent 4xx returns
 *      `{ ok: false, ... }` immediately (don't retry a rejected payload).
 *   5. Before the next attempt, `await sleep(baseDelayMs * 2 ** (attempt - 1))`. Do NOT sleep
 *      after the final attempt.
 *   6. Exhausted all attempts → return `{ ok: false, attempts: maxAttempts, statuses }`.
 */
export async function deliver(
  _url: string,
  _body: string,
  _opts: DeliverOptions,
): Promise<DeliveryResult> {
  throw new Error("TODO: retry loop with exponential backoff and transient-only retries");
}
