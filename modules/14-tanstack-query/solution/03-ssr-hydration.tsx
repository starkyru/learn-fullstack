import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  useQuery,
} from "@tanstack/react-query";
import type { DehydratedState } from "@tanstack/react-query";
import type { ReactElement } from "react";

/**
 * Task 3 — SSR prefetch → dehydrate → serialize → hydrate (reference solution).
 *
 * On the server you PREFETCH into a throwaway `QueryClient`, `dehydrate` its cache to a plain
 * serializable object, and ship it on the wire (here: a JSON string). On the client you `hydrate`
 * that state into the browser's `QueryClient` — so the first render already has the data and
 * `useQuery` returns it synchronously. With `staleTime` keeping the hydrated entry FRESH, the query
 * function never runs on the client: no refetch, no loading flash.
 *
 * `prefetchCards`/`hydrateCards` are our logic; the round-trip test checks the cache survives the
 * dehydrate→JSON→hydrate trip, and the render test checks the client `queryFn` is never called.
 */

export interface Card {
  id: string;
  title: string;
}

export const cardsKey = ["cards"] as const;

/** SERVER: prefetch into a fresh client and return the dehydrated cache as a wire string. */
export async function prefetchCards(fetchCards: () => Promise<Card[]>): Promise<string> {
  const client = new QueryClient();
  await client.prefetchQuery({ queryKey: cardsKey, queryFn: fetchCards });
  const state = dehydrate(client);
  return JSON.stringify(state);
}

/** CLIENT (test seam): rebuild a client from the wire string and hand back its warm cache. */
export function hydrateCards(wire: string): QueryClient {
  const client = new QueryClient();
  hydrate(client, JSON.parse(wire) as DehydratedState);
  return client;
}

/** Reads the cards query; `staleTime: Infinity` keeps hydrated data fresh so nothing refetches. */
export function CardsView({ queryFn }: { queryFn: () => Promise<Card[]> }): ReactElement {
  const { data, isPending } = useQuery({
    queryKey: cardsKey,
    queryFn,
    staleTime: Infinity,
  });
  if (isPending) return <p>loading</p>;
  return (
    <ul>
      {(data ?? []).map((c) => (
        <li key={c.id}>{c.title}</li>
      ))}
    </ul>
  );
}

/** Wraps the view in a provider + `HydrationBoundary` that hydrates during render, pre-children. */
export function HydratedCards({
  wire,
  client,
  queryFn,
}: {
  wire: string;
  client: QueryClient;
  queryFn: () => Promise<Card[]>;
}): ReactElement {
  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={JSON.parse(wire) as DehydratedState}>
        <CardsView queryFn={queryFn} />
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
