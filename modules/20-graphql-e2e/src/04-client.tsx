/**
 * Task 4 — A typed React GraphQL client with a normalized cache + optimistic updates (WORKED EXAMPLE).
 *
 * `GraphQLClient` POSTs `{ query, variables }` over an INJECTED `fetch` (so tests drive it with MSW).
 * `NormalizedCache` stores entities by `__typename:id` — the same identity Apollo/urql use — and
 * publishes changes through `useSyncExternalStore`, so any hook reading it re-renders on a write.
 * `useCardsQuery` is the fully-solved reference: fetch → normalize → render. Then YOUR TURN:
 * implement `useAddCardMutation` so it writes an OPTIMISTIC card into the cache immediately, then
 * RECONCILES it with the server's real card on resolve (or rolls back on error). Tests import from
 * `solution/`; point them at `../src/...` to grade your own build.
 */
import { useEffect, useState, useSyncExternalStore } from "react";

/* ─────────────────────────── the typed transport ─────────────────────────── */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class GraphQLClient {
  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch,
  ) {}

  async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await this.fetchFn(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0]!.message);
    }
    return json.data as T;
  }
}

/* ─────────────────────────── the normalized cache ─────────────────────────── */

export interface Entity {
  __typename: string;
  id: string;
  [key: string]: unknown;
}

export class NormalizedCache {
  private readonly entities = new Map<string, Entity>();
  private readonly listeners = new Set<() => void>();
  private version = 0;

  static keyOf(entity: Pick<Entity, "__typename" | "id">): string {
    return `${entity.__typename}:${entity.id}`;
  }

  write(entities: Entity[]): void {
    for (const entity of entities) {
      const key = NormalizedCache.keyOf(entity);
      this.entities.set(key, { ...this.entities.get(key), ...entity });
    }
    this.bump();
  }

  read(key: string): Entity | undefined {
    return this.entities.get(key);
  }

  readAll(typename: string): Entity[] {
    return [...this.entities.values()].filter((e) => e.__typename === typename);
  }

  remove(key: string): void {
    if (this.entities.delete(key)) this.bump();
  }

  replace(tempKey: string, entity: Entity): void {
    this.entities.delete(tempKey);
    this.entities.set(NormalizedCache.keyOf(entity), entity);
    this.bump();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => this.version;

  private bump(): void {
    this.version += 1;
    for (const l of this.listeners) l();
  }
}

/* ─────────────────────────── typed operations ─────────────────────────── */

export interface CardEntity extends Entity {
  __typename: "Card";
  title: string;
  listId: string;
}

export const CARDS_QUERY = /* GraphQL */ `
  query Cards {
    cards {
      __typename
      id
      title
      listId
    }
  }
`;

export const ADD_CARD_MUTATION = /* GraphQL */ `
  mutation AddCard($title: String!, $listId: ID!) {
    addCard(input: { title: $title, listId: $listId }) {
      __typename
      id
      title
      listId
    }
  }
`;

export interface IdSource {
  next(): string;
}
export function seqIdSource(prefix = "tmp-"): IdSource {
  let n = 0;
  return { next: () => `${prefix}${++n}` };
}

/* ─────────────────────────── worked example: useCardsQuery ─────────────────────────── */

export function useCardsQuery(
  client: GraphQLClient,
  cache: NormalizedCache,
): { cards: CardEntity[]; loading: boolean; error: string | null } {
  useSyncExternalStore(cache.subscribe, cache.getSnapshot, cache.getSnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    client
      .request<{ cards: CardEntity[] }>(CARDS_QUERY)
      .then((data) => {
        if (!active) return;
        cache.write(data.cards);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, cache]);

  return { cards: cache.readAll("Card") as CardEntity[], loading, error };
}

/* ─────────────────────────── YOUR TURN: useAddCardMutation ───────────────────────────
 *
 * Mirror `useCardsQuery`'s cache usage, but WRITE first: mint a temp id via `ids.next()`, `cache.write`
 * an optimistic `CardEntity` immediately, then `await client.request(ADD_CARD_MUTATION, input)` and
 * `cache.replace(tempKey, confirmed)` on success (or `cache.remove(tempKey)` on error). */

export function useAddCardMutation(
  client: GraphQLClient,
  cache: NormalizedCache,
  ids: IdSource,
): {
  mutate: (input: { title: string; listId: string }) => Promise<CardEntity>;
  pending: boolean;
} {
  const [pending, setPending] = useState(false);
  void client;
  void cache;
  void ids;
  void setPending;

  const mutate = async (_input: {
    title: string;
    listId: string;
  }): Promise<CardEntity> => {
    throw new Error(
      "TODO: optimistically cache.write a temp CardEntity, request ADD_CARD_MUTATION, then cache.replace (or cache.remove on error)",
    );
  };

  return { mutate, pending };
}
