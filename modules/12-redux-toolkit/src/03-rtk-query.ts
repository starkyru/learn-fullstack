import { configureStore } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { Card } from "./01-slices.js";

/**
 * RTK Query: a cache kept fresh with tags.
 *
 * YOUR TURN — complete the two endpoints:
 *   getCards: add `providesTags: ["Cards"]`.
 *   addCard:  add `invalidatesTags: ["Cards"]` (so getCards refetches on success) AND an
 *             `onQueryStarted` that optimistically pushes the new card into the getCards cache
 *             via `cardsApi.util.updateQueryData("getCards", undefined, draft => …)`, then
 *             `await queryFulfilled` and `patch.undo()` in a catch to roll back on failure.
 */

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost/api" }),
  tagTypes: ["Cards"],
  endpoints: (build) => ({
    getCards: build.query<Card[], void>({
      query: () => "/cards",
      // TODO: providesTags
    }),
    addCard: build.mutation<Card, { title: string }>({
      query: (body) => ({ url: "/cards", method: "POST", body }),
      // TODO: invalidatesTags + onQueryStarted optimistic update with rollback
    }),
  }),
});

// (React hooks come from the `@reduxjs/toolkit/query/react` entry; this module is store-only.)

export function makeCardsStore() {
  return configureStore({
    reducer: { [cardsApi.reducerPath]: cardsApi.reducer },
    middleware: (getDefault) => getDefault().concat(cardsApi.middleware),
  });
}

export function selectCards(
  store: ReturnType<typeof makeCardsStore>,
): Card[] | undefined {
  return cardsApi.endpoints.getCards.select()(store.getState()).data;
}
