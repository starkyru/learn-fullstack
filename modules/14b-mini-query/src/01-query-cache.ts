/**
 * Build a TanStack-Query-shaped async cache from scratch: a closure over a `Map` of query entries
 * (keyed by the serialized query key) + a `Map` of listener sets.
 *
 * YOUR TURN — implement `createQueryClient`. It returns an object with:
 *   - getEntry(key): return the current entry, creating an idle one if the key is unseen.
 *   - setEntry(key, patch): REPLACE the entry with `{ ...prev, ...patch }` (a new object!) and then
 *     notify every listener registered for the key.
 *   - getQueryData(key) / setQueryData(key, data): read / write the `data` slice (a success write).
 *   - subscribe(key, listener): add the listener, RETURN an unsubscribe that removes it (no leak).
 *   - getSubscriberCount(key): how many listeners a key currently has.
 *   - fetchQuery(key, fetcher, { staleTime }):
 *       1. if an in-flight `promise` exists, return it (DEDUPE — one request for N callers);
 *       2. if `status === "success"` and `now() - updatedAt < staleTime`, return the cached value;
 *       3. otherwise run `fetcher()`, stash the promise + fetcher on the entry (isFetching true),
 *          and on settle update the entry (status/data/error, promise undefined, updatedAt = now())
 *          — ignoring a superseded promise.
 * Inject the clock: `now = options.now ?? Date.now` so freshness is deterministic under test.
 */

export type QueryKey = unknown;

export type QueryStatus = "idle" | "pending" | "success" | "error";

export interface QueryState<T> {
  status: QueryStatus;
  data: T | undefined;
  error: unknown;
  promise: Promise<T> | undefined;
  updatedAt: number;
  isFetching: boolean;
  fetcher: (() => Promise<T>) | undefined;
}

export interface FetchQueryOptions {
  staleTime?: number;
}

export interface QueryClientOptions {
  now?: () => number;
}

export interface QueryClient {
  now: () => number;
  getEntry: <T>(key: QueryKey) => QueryState<T>;
  setEntry: <T>(key: QueryKey, patch: Partial<QueryState<T>>) => void;
  getQueryData: <T>(key: QueryKey) => T | undefined;
  setQueryData: <T>(key: QueryKey, data: T) => void;
  fetchQuery: <T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: FetchQueryOptions,
  ) => Promise<T>;
  subscribe: (key: QueryKey, listener: () => void) => () => void;
  getSubscriberCount: (key: QueryKey) => number;
}

export function createQueryClient(_options: QueryClientOptions = {}): QueryClient {
  throw new Error(
    "TODO: build the query-cache closure (getEntry / setEntry / fetchQuery / subscribe)",
  );
}
