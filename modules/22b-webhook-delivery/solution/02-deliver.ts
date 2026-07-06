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
 * Deliver a webhook with bounded retries and exponential backoff. Retries only on transient
 * failures (network error, 429, 5xx); a permanent 4xx stops immediately — retrying a rejected
 * payload just wastes attempts. Backoff between attempt n and n+1 is `baseDelayMs * 2^(n-1)`.
 */
export async function deliver(
  url: string,
  body: string,
  opts: DeliverOptions,
): Promise<DeliveryResult> {
  const { transport, sleep, maxAttempts = 5, baseDelayMs = 100, headers = {} } = opts;
  const statuses: number[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let status: number;
    try {
      ({ status } = await transport(url, { body, headers }));
    } catch {
      status = 0; // network error — transient
    }
    statuses.push(status);

    if (status >= 200 && status < 300) {
      return { ok: true, attempts: attempt, statuses };
    }

    const retryable = status === 0 || status === 429 || status >= 500;
    if (!retryable) {
      return { ok: false, attempts: attempt, statuses }; // permanent 4xx
    }
    if (attempt < maxAttempts) {
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  return { ok: false, attempts: maxAttempts, statuses };
}
