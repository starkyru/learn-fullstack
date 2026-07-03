export interface FetcherOptions {
  retries: number;
  timeoutMs: number;
}

export function createFetcher(opts: FetcherOptions): (url: string) => Promise<Response> {
  const inFlight = new Map<string, Promise<Response>>();

  async function attempt(url: string): Promise<Response> {
    let lastError: unknown;
    for (let i = 0; i <= opts.retries; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res;
      } catch (err) {
        lastError = err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  return function get(url: string): Promise<Response> {
    const existing = inFlight.get(url);
    if (existing) return existing;
    const promise = attempt(url).finally(() => inFlight.delete(url));
    inFlight.set(url, promise);
    return promise;
  };
}
