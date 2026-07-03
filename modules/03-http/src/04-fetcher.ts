export interface FetcherOptions {
  retries: number;
  timeoutMs: number;
}

/**
 * YOUR TURN (🔴 from scratch) — return a `get(url)` function that:
 *  - times out a single attempt after `timeoutMs` (use AbortController),
 *  - retries up to `retries` times on failure,
 *  - DE-DUPES: concurrent calls for the SAME url share one in-flight request.
 * Return type: (url: string) => Promise<Response>. No axios / p-retry.
 */
export function createFetcher(_opts: FetcherOptions): (url: string) => Promise<Response> {
  throw new Error("TODO: build a fetcher with timeout + retry + in-flight de-dupe");
}
