import { useSyncExternalStore } from "react";
import type { QueryClient, QueryKey, QueryStatus } from "./01-query-cache.js";

/**
 * The React binding on `useSyncExternalStore`. Wire a component to ONE query entry.
 *
 * YOUR TURN — implement `useQuery`:
 *   - keep the latest `key` / `fetcher` / `options` in refs so the memoized callbacks can read them.
 *   - subscribe: register `client.subscribe(key, onStoreChange)` AND kick off
 *     `client.fetchQuery(key, fetcher, { staleTime })` (dedupe makes N components → one request);
 *     RETURN the client's unsubscribe so React removes the listener on unmount.
 *   - getSnapshot: return `client.getEntry(key)` — a stable reference until a write replaces it.
 *   - memoize subscribe/getSnapshot on the serialized key, wire them with `useSyncExternalStore`,
 *     and project the entry down to `{ status, data, error, isFetching }`.
 */

export interface UseQueryOptions {
  staleTime?: number;
  enabled?: boolean;
}

export interface UseQueryResult<T> {
  status: QueryStatus;
  data: T | undefined;
  error: unknown;
  isFetching: boolean;
}

export function useQuery<T>(
  _client: QueryClient,
  _key: QueryKey,
  _fetcher: () => Promise<T>,
  _options: UseQueryOptions = {},
): UseQueryResult<T> {
  // Keep the hook call so the shape is right; replace the body with the subscribe/getSnapshot wiring.
  useSyncExternalStore(
    () => () => {},
    (): never => {
      throw new Error("TODO: implement getSnapshot -> client.getEntry(key)");
    },
    (): never => {
      throw new Error("TODO: implement getSnapshot -> client.getEntry(key)");
    },
  );
  throw new Error(
    "TODO: subscribe + fetch, then project the entry to { status, data, error, isFetching }",
  );
}
