import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

/**
 * Task 1 — Queries & mutations (WORKED EXAMPLE).
 *
 * `useCards` and `useAddCard` are solved for you: read them closely. `useQuery` shares one deduped
 * cache entry per `queryKey`; `useMutation` writes, then `invalidateQueries` refetches the active
 * subscribers so the list reconciles to server state.
 *
 * The network is the only real boundary, so tests intercept `fetch` with MSW and drive the real
 * hooks under a `QueryClientProvider`.
 */

export interface Card {
  id: string;
  title: string;
}

export interface List {
  id: string;
  name: string;
}

/** Base the fetches on an absolute origin so MSW can intercept them in jsdom. */
export const API = "http://api.test";

export const cardsKey = ["cards"] as const;
export const listsKey = ["lists"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Reference query: GET /cards, keyed by `cardsKey`. */
export function useCards(): UseQueryResult<Card[]> {
  return useQuery({
    queryKey: cardsKey,
    queryFn: () => getJson<Card[]>(`${API}/cards`),
  });
}

/**
 * YOUR TURN — mirror `useCards` for lists:
 *   - call `useQuery` with `queryKey: listsKey` and a `queryFn` that GETs `${API}/lists`.
 *   - return the query result typed as `UseQueryResult<List[]>`.
 */
export function useLists(): UseQueryResult<List[]> {
  throw new Error(
    "TODO: mirror useCards — useQuery({ queryKey: listsKey, queryFn: GET /lists })",
  );
}

/**
 * Mutation: POST /cards, then invalidate the cards key so the list refetches and reconciles to the
 * server's authoritative state. We return the created card so callers can read it if they want.
 */
export function useAddCard(): UseMutationResult<Card, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string): Promise<Card> => {
      const res = await fetch(`${API}/cards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Card;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cardsKey });
    },
  });
}
