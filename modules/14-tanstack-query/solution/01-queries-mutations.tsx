import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

/**
 * Task 1 — Queries & mutations (reference solution).
 *
 * `useQuery` turns a keyed async fetch into declarative cache state: give it a stable `queryKey`
 * and a `queryFn`, and every component that reads the same key shares one cache entry (one request,
 * deduped). `useMutation` wraps a write; after it succeeds we `invalidateQueries` the cards key,
 * which marks the query stale and refetches the ACTIVE subscribers — so the list updates itself.
 *
 * The network is the only real boundary here, so tests intercept `fetch` with MSW and drive the
 * real hooks under a `QueryClientProvider`. Nothing about the cache is mocked.
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
 * Analog query — the SAME shape as `useCards`, but for GET /lists keyed by `listsKey`.
 * (Solved here in the solution; a throwing stub in `src/` is your turn.)
 */
export function useLists(): UseQueryResult<List[]> {
  return useQuery({
    queryKey: listsKey,
    queryFn: () => getJson<List[]>(`${API}/lists`),
  });
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
