import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { DehydratedState } from "@tanstack/react-query";
import type { ReactElement } from "react";

/**
 * Task 3 — SSR prefetch → dehydrate → serialize → hydrate (TODO).
 *
 * Implement the server prefetch, the client hydrate, and the components that render from the warm
 * cache WITHOUT a refetch flash.
 */

export interface Card {
  id: string;
  title: string;
}

export const cardsKey = ["cards"] as const;

/**
 * YOUR TURN — SERVER prefetch:
 *   - make a fresh `QueryClient`.
 *   - `await client.prefetchQuery({ queryKey: cardsKey, queryFn: fetchCards })`.
 *   - `dehydrate(client)` and return it as a JSON string (the SSR "wire").
 */
export async function prefetchCards(_fetchCards: () => Promise<Card[]>): Promise<string> {
  throw new Error("TODO: prefetchQuery → dehydrate → JSON.stringify");
}

/**
 * YOUR TURN — CLIENT hydrate:
 *   - make a fresh `QueryClient`, `hydrate(client, JSON.parse(wire) as DehydratedState)`, return it.
 */
export function hydrateCards(_wire: string): QueryClient {
  throw new Error(
    "TODO: new QueryClient → hydrate(client, parsed state) → return client",
  );
}

/**
 * YOUR TURN — read the query with `staleTime: Infinity` so hydrated data stays fresh (no refetch).
 * Render `loading` while pending, otherwise a `<li>` per card title.
 */
export function CardsView(_props: { queryFn: () => Promise<Card[]> }): ReactElement {
  // Keep the hook call so the shape is right once you fill in the body.
  useQuery({
    queryKey: cardsKey,
    queryFn: (): never => {
      throw new Error("TODO: pass the injected queryFn");
    },
    enabled: false,
  });
  throw new Error("TODO: render loading / <li> per card with staleTime: Infinity");
}

/**
 * YOUR TURN — wrap `CardsView` in a `QueryClientProvider` + `HydrationBoundary` whose `state` is the
 * parsed wire, so the cache is warm before children render.
 */
export function HydratedCards(_props: {
  wire: string;
  client: QueryClient;
  queryFn: () => Promise<Card[]>;
}): ReactElement {
  // References so the imports stay meaningful while stubbed.
  void HydrationBoundary;
  void QueryClientProvider;
  const _typeAnchor: DehydratedState | undefined = undefined;
  void _typeAnchor;
  throw new Error("TODO: QueryClientProvider > HydrationBoundary(state) > CardsView");
}
