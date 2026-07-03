import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";

/**
 * Task 2 — Optimistic mutation + infinite query (TODO).
 *
 * `useCards` is given. Implement `useMoveCard` and `useInfiniteActivity`.
 */

export interface Card {
  id: string;
  title: string;
  columnId: string;
}

export interface Activity {
  id: string;
  text: string;
}

export interface ActivityPage {
  items: Activity[];
  nextCursor: number | null;
}

export const API = "http://api.test";
export const cardsKey = ["cards"] as const;
export const activityKey = ["activity"] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function useCards(): UseQueryResult<Card[]> {
  return useQuery({
    queryKey: cardsKey,
    queryFn: () => getJson<Card[]>(`${API}/cards`),
  });
}

export interface MoveVars {
  id: string;
  toColumn: string;
}

interface MoveContext {
  previous: Card[] | undefined;
}

/**
 * YOUR TURN — the optimistic move (four steps):
 *   - mutationFn: POST `${API}/cards/${id}/move` with `{ toColumn }`; return the created card.
 *   - onMutate: `await cancelQueries({ queryKey: cardsKey })`, snapshot `getQueryData(cardsKey)`,
 *     then `setQueryData` mapping the matching card's `columnId` to `toColumn`; return { previous }.
 *   - onError: if we have a snapshot, `setQueryData(cardsKey, context.previous)` to roll back.
 *   - onSettled: `invalidateQueries({ queryKey: cardsKey })` so the server's value reconciles in.
 */
export function useMoveCard(): UseMutationResult<Card, Error, MoveVars, MoveContext> {
  const queryClient = useQueryClient();
  void queryClient;
  throw new Error(
    "TODO: optimistic move — onMutate/onError/onSettled around POST /cards/:id/move",
  );
}

/**
 * YOUR TURN — page an activity feed:
 *   - `useInfiniteQuery` with `queryKey: activityKey`.
 *   - `queryFn` GETs `${API}/activity?cursor=${pageParam}` returning an `ActivityPage`.
 *   - `initialPageParam: 0` and `getNextPageParam: (lastPage) => lastPage.nextCursor`.
 */
export function useInfiniteActivity(): UseInfiniteQueryResult<
  InfiniteData<ActivityPage, number>,
  Error
> {
  throw new Error(
    "TODO: useInfiniteQuery over /activity with a cursor-based getNextPageParam",
  );
}
