import { useCallback, useRef, useSyncExternalStore } from "react";
import type { QueryClient, QueryKey, QueryState, QueryStatus } from "./01-query-cache.js";

/**
 * The React binding on `useSyncExternalStore`. It wires a component to ONE query entry:
 *
 *   - `subscribe` registers the store's change callback for the key AND kicks off `fetchQuery`
 *     (dedupe means N mounted components with the same key still cause one request). It returns the
 *     client's unsubscribe, so React removes the listener on unmount — no leak.
 *   - `getSnapshot` returns the current entry object. Because every cache write REPLACES that object,
 *     the snapshot's reference is stable while nothing changes and fresh when it does — exactly what
 *     `useSyncExternalStore`'s `Object.is` check wants.
 *
 * The latest `fetcher`/`options`/`key` are held in refs so the memoized `subscribe`/`getSnapshot`
 * (keyed on the serialized query key) can read them without re-subscribing every render.
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
  client: QueryClient,
  key: QueryKey,
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {},
): UseQueryResult<T> {
  const hash = JSON.stringify(key);

  const keyRef = useRef(key);
  keyRef.current = key;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const activeKey = keyRef.current;
      const unsubscribe = client.subscribe(activeKey, onStoreChange);
      if (optionsRef.current.enabled !== false) {
        void client.fetchQuery(activeKey, fetcherRef.current, {
          staleTime: optionsRef.current.staleTime,
        });
      }
      return unsubscribe;
    },
    [client, hash],
  );

  const getSnapshot = useCallback(
    (): QueryState<T> => client.getEntry<T>(keyRef.current),
    [client, hash],
  );

  const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    status: entry.status,
    data: entry.data,
    error: entry.error,
    isFetching: entry.isFetching,
  };
}
