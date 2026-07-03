/**
 * A TanStack-Query-shaped async cache, from scratch — no library. The client is a closure over a
 * `Map` of query entries (keyed by the serialized query key) plus a `Map` of listener sets. That is
 * the whole "query cache" contract that `useQuery` consumes.
 *
 *   - `fetchQuery(key, fn, { staleTime })` DEDUPES: if an in-flight `promise` exists it is returned
 *     as-is (two callers → one request). If the cached data is still fresh (`now() - updatedAt <
 *     staleTime`) the cached value is returned without calling `fn`. Otherwise `fn()` runs, its
 *     promise is stashed on the entry, and the entry is updated + listeners notified on settle.
 *   - Every write REPLACES the entry object, so `useSyncExternalStore`'s `Object.is` snapshot check
 *     sees a new reference and re-renders.
 *   - `subscribe(key, listener)` returns an unsubscribe — call it and the listener is gone (no leak).
 *   - The clock is INJECTED (`now`, default `Date.now`) so freshness is deterministic under test.
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

function hashKey(key: QueryKey): string {
  return JSON.stringify(key);
}

function createInitialEntry<T>(): QueryState<T> {
  return {
    status: "idle",
    data: undefined,
    error: undefined,
    promise: undefined,
    updatedAt: 0,
    isFetching: false,
    fetcher: undefined,
  };
}

export function createQueryClient(options: QueryClientOptions = {}): QueryClient {
  const now = options.now ?? Date.now;
  const state = new Map<string, QueryState<unknown>>();
  const listeners = new Map<string, Set<() => void>>();

  const getEntry = <T>(key: QueryKey): QueryState<T> => {
    const hash = hashKey(key);
    let entry = state.get(hash);
    if (entry === undefined) {
      entry = createInitialEntry();
      state.set(hash, entry);
    }
    return entry as QueryState<T>;
  };

  // Every write produces a NEW entry object so `useSyncExternalStore` sees an `Object.is` change,
  // then fans out to the key's listeners.
  const setEntry = <T>(key: QueryKey, patch: Partial<QueryState<T>>): void => {
    const hash = hashKey(key);
    const prev = getEntry<T>(key);
    const next = { ...prev, ...patch } as QueryState<unknown>;
    state.set(hash, next);
    const subs = listeners.get(hash);
    if (subs) for (const listener of subs) listener();
  };

  const getQueryData = <T>(key: QueryKey): T | undefined => getEntry<T>(key).data;

  const setQueryData = <T>(key: QueryKey, data: T): void => {
    setEntry<T>(key, {
      status: "success",
      data,
      error: undefined,
      isFetching: false,
      updatedAt: now(),
    });
  };

  const subscribe = (key: QueryKey, listener: () => void): (() => void) => {
    const hash = hashKey(key);
    let subs = listeners.get(hash);
    if (subs === undefined) {
      subs = new Set();
      listeners.set(hash, subs);
    }
    subs.add(listener);
    return () => {
      const current = listeners.get(hash);
      if (current === undefined) return;
      current.delete(listener);
      if (current.size === 0) listeners.delete(hash);
    };
  };

  const getSubscriberCount = (key: QueryKey): number =>
    listeners.get(hashKey(key))?.size ?? 0;

  const fetchQuery = <T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    fetchOptions: FetchQueryOptions = {},
  ): Promise<T> => {
    const entry = getEntry<T>(key);
    const staleTime = fetchOptions.staleTime ?? 0;

    // Dedupe: an in-flight request is shared by every caller.
    if (entry.promise !== undefined) return entry.promise;

    // Fresh cache hit: within staleTime, hand back the cached value without touching the network.
    if (entry.status === "success" && now() - entry.updatedAt < staleTime) {
      return Promise.resolve(entry.data as T);
    }

    const promise = fetcher();
    setEntry<T>(key, {
      status: entry.data !== undefined ? "success" : "pending",
      isFetching: true,
      promise,
      fetcher,
    });

    promise.then(
      (data) => {
        // Ignore a superseded request (a newer fetch replaced this promise).
        if (getEntry<T>(key).promise !== promise) return;
        setEntry<T>(key, {
          status: "success",
          data,
          error: undefined,
          isFetching: false,
          promise: undefined,
          updatedAt: now(),
        });
      },
      (error: unknown) => {
        if (getEntry<T>(key).promise !== promise) return;
        setEntry<T>(key, {
          status: "error",
          error,
          isFetching: false,
          promise: undefined,
          updatedAt: now(),
        });
      },
    );

    return promise;
  };

  return {
    now,
    getEntry,
    setEntry,
    getQueryData,
    setQueryData,
    fetchQuery,
    subscribe,
    getSubscriberCount,
  };
}
