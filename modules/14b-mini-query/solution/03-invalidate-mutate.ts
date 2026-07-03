import type { QueryClient, QueryKey } from "./01-query-cache.js";

/**
 * Invalidation and mutation — the two write-side pieces layered on the cache from task 1.
 *
 *   - `invalidateQuery(client, key)` marks the entry stale (an impossibly-old `updatedAt`, so any
 *     later freshness check fails) and, IF the key is actively subscribed, refetches it with the
 *     remembered `fetcher`. Refetching fans out through `setEntry`, so subscribers are notified.
 *   - `mutate(client, options)` runs an optimistic update: `onMutate` applies the optimistic cache
 *     change synchronously and returns a rollback context; on success the `invalidateKeys` are
 *     invalidated; on rejection `rollback` restores the exact previous value and the error rethrows.
 */

export function invalidateQuery(client: QueryClient, key: QueryKey): Promise<void> {
  const entry = client.getEntry(key);
  // Mark stale: -Infinity means `now() - updatedAt` is always >= any staleTime → never fresh.
  client.setEntry(key, { updatedAt: -Infinity });

  // Only refetch keys someone is actually watching; an unobserved key just becomes stale.
  if (entry.fetcher !== undefined && client.getSubscriberCount(key) > 0) {
    return client.fetchQuery(key, entry.fetcher, { staleTime: 0 }).then(() => undefined);
  }
  return Promise.resolve();
}

export interface MutateOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  variables?: TVariables;
  /** Optimistic step: mutate the cache now, return a context used to roll back on error. */
  onMutate?: (variables: TVariables) => TContext;
  /** Undo the optimistic step when `mutationFn` rejects. */
  rollback?: (
    context: TContext | undefined,
    error: unknown,
    variables: TVariables,
  ) => void;
  /** Keys to invalidate once the mutation settles successfully. */
  invalidateKeys?: QueryKey[];
}

export async function mutate<TData, TVariables = void, TContext = unknown>(
  client: QueryClient,
  options: MutateOptions<TData, TVariables, TContext>,
): Promise<TData> {
  const variables = options.variables as TVariables;
  const context = options.onMutate ? options.onMutate(variables) : undefined;

  try {
    const data = await options.mutationFn(variables);
    if (options.invalidateKeys !== undefined) {
      for (const key of options.invalidateKeys) {
        await invalidateQuery(client, key);
      }
    }
    return data;
  } catch (error) {
    if (options.rollback) options.rollback(context, error, variables);
    throw error;
  }
}
