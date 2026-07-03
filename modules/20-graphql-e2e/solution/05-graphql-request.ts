/**
 * Task 5 — `graphql-request` as an alternative client (EXT: `src/` mirrors this).
 *
 * `graphql-request` is a thin typed fetch wrapper: one `request(query)` → the response `data`, no
 * store. Pair it with a TanStack-Query-style `{ queryKey, queryFn }` and React Query caches the WHOLE
 * response under `queryKey` (`["cards"]`) — coarse, document-level caching.
 *
 * Compare with Task 4's `NormalizedCache`:
 *   - graphql-request + TanStack Query: cache key = the query + its variables; entities are NOT
 *     shared between queries, and there is no built-in optimistic entity patching — you invalidate or
 *     hand-write `setQueryData` for the whole list.
 *   - normalized cache (Task 4): cache key = `__typename:id`; one card is one entry reused across
 *     every query/mutation, so an optimistic insert shows up everywhere that card is rendered.
 * Same wire query, two cache philosophies: document cache vs entity cache.
 */
import { gql, GraphQLClient } from "graphql-request";

export interface CardDto {
  __typename: "Card";
  id: string;
  title: string;
  listId: string;
}

export const CARDS_QUERY = gql`
  query Cards {
    cards {
      __typename
      id
      title
      listId
    }
  }
`;

/** Build a `graphql-request` client over an INJECTED fetch (so tests drive it with MSW). */
export function makeClient(url: string, fetchFn: typeof fetch): GraphQLClient {
  return new GraphQLClient(url, { fetch: fetchFn });
}

export async function fetchCards(client: GraphQLClient): Promise<CardDto[]> {
  const data = await client.request<{ cards: CardDto[] }>(CARDS_QUERY);
  return data.cards;
}

/** The TanStack-Query-style options object — `queryFn` is what React Query would call + cache. */
export interface CardsQueryOptions {
  queryKey: readonly ["cards"];
  queryFn: () => Promise<CardDto[]>;
}

export function cardsQueryOptions(client: GraphQLClient): CardsQueryOptions {
  return {
    queryKey: ["cards"] as const,
    queryFn: () => fetchCards(client),
  };
}
