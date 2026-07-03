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
 * Task 2 — Optimistic mutation + infinite query (reference solution).
 *
 * OPTIMISTIC MOVE — the four-step dance every write should learn:
 *   1. onMutate: `cancelQueries` so an in-flight refetch can't clobber our patch, snapshot the
 *      current cache (`getQueryData`) for rollback, then `setQueryData` optimistically.
 *   2. mutationFn: do the real write.
 *   3. onError: restore the snapshot exactly — the UI un-does the optimistic patch.
 *   4. onSettled: `invalidateQueries` so the final state is the SERVER's, not our guess.
 *
 * The server canonicalizes the column name ("in-progress" → "doing"), so the optimistic value and
 * the reconciled value are DIFFERENT strings — which is what lets a test see the hand-off.
 *
 * INFINITE ACTIVITY — `useInfiniteQuery` keeps `data.pages`; `getNextPageParam` reads the cursor of
 * the last page, and `fetchNextPage` appends the next page.
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

export function useMoveCard(): UseMutationResult<Card, Error, MoveVars, MoveContext> {
  const queryClient = useQueryClient();
  return useMutation<Card, Error, MoveVars, MoveContext>({
    mutationFn: async ({ id, toColumn }): Promise<Card> => {
      const res = await fetch(`${API}/cards/${id}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toColumn }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Card;
    },
    onMutate: async ({ id, toColumn }): Promise<MoveContext> => {
      await queryClient.cancelQueries({ queryKey: cardsKey });
      const previous = queryClient.getQueryData<Card[]>(cardsKey);
      queryClient.setQueryData<Card[]>(cardsKey, (old) =>
        (old ?? []).map((c) => (c.id === id ? { ...c, columnId: toColumn } : c)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(cardsKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cardsKey });
    },
  });
}

export function useInfiniteActivity(): UseInfiniteQueryResult<
  InfiniteData<ActivityPage, number>,
  Error
> {
  return useInfiniteQuery({
    queryKey: activityKey,
    queryFn: ({ pageParam }) =>
      getJson<ActivityPage>(`${API}/activity?cursor=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
