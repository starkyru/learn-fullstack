import type { QueryClient, QueryKey } from "./01-query-cache.js";

/**
 * Invalidation and mutation — the write-side pieces layered on the cache from task 1.
 *
 * YOUR TURN — implement `invalidateQuery` and `mutate`:
 *   - invalidateQuery: mark the entry stale (set `updatedAt` to `-Infinity`), then IF the key has
 *     subscribers and a remembered `fetcher`, refetch it with `{ staleTime: 0 }` (which notifies the
 *     subscribers via setEntry). Return a `Promise<void>`.
 *   - mutate: call `onMutate(variables)` synchronously to apply the optimistic cache change and get a
 *     rollback context; `await mutationFn(variables)`; on success `await invalidateQuery` for each of
 *     `invalidateKeys` and return the data; on error call `rollback(context, error, variables)` and
 *     rethrow.
 */

export function invalidateQuery(_client: QueryClient, _key: QueryKey): Promise<void> {
  throw new Error(
    "TODO: mark stale, then refetch active subscribers with the remembered fetcher",
  );
}

export interface MutateOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  variables?: TVariables;
  onMutate?: (variables: TVariables) => TContext;
  rollback?: (
    context: TContext | undefined,
    error: unknown,
    variables: TVariables,
  ) => void;
  invalidateKeys?: QueryKey[];
}

export async function mutate<TData, TVariables = void, TContext = unknown>(
  _client: QueryClient,
  _options: MutateOptions<TData, TVariables, TContext>,
): Promise<TData> {
  throw new Error(
    "TODO: optimistic onMutate, run mutationFn, invalidate on success, rollback on error",
  );
}
