/**
 * WORKED EXAMPLE — retry an async fn up to `retries` times, waiting `delayMs` between
 * attempts. Rethrows the last error if all attempts fail.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; delayMs: number },
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < opts.retries) await new Promise((r) => setTimeout(r, opts.delayMs));
    }
  }
  throw lastError;
}

/**
 * YOUR TURN — reject with `new Error("timeout")` if `promise` hasn't settled within `ms`;
 * otherwise resolve/reject with the promise's own outcome.
 * Hint: race the input promise against a timer; return a `Promise<T>`.
 */
export function withTimeout<T>(_promise: Promise<T>, _ms: number): Promise<T> {
  throw new Error("TODO: race the promise against a timeout");
}
