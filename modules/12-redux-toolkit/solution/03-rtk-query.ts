import { configureStore } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { Card } from "./01-slices.js";

/**
 * RTK Query: a cache keyed by endpoint+args, kept fresh with tags.
 *   - `getCards` PROVIDES the "Cards" tag.
 *   - `addCard` INVALIDATES it → any active `getCards` subscription auto-refetches on success.
 *   - `onQueryStarted` applies an OPTIMISTIC patch immediately and rolls it back if the request
 *     rejects (`patch.undo()`), so the UI never shows a card the server refused.
 */

export const cardsApi = createApi({
  reducerPath: "cardsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost/api" }),
  tagTypes: ["Cards"],
  endpoints: (build) => ({
    getCards: build.query<Card[], void>({
      query: () => "/cards",
      providesTags: ["Cards"],
    }),
    addCard: build.mutation<Card, { title: string }>({
      query: (body) => ({ url: "/cards", method: "POST", body }),
      invalidatesTags: ["Cards"],
      onQueryStarted: async ({ title }, { dispatch, queryFulfilled }) => {
        const patch = dispatch(
          cardsApi.util.updateQueryData("getCards", undefined, (draft) => {
            draft.push({ id: "optimistic", title, columnId: "todo" });
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

// (React hooks like `useGetCardsQuery` come from the `@reduxjs/toolkit/query/react` entry; this
// module stays framework-free and drives the API through the store directly.)

/** A store wired with the RTK Query reducer + middleware. */
export function makeCardsStore() {
  return configureStore({
    reducer: { [cardsApi.reducerPath]: cardsApi.reducer },
    middleware: (getDefault) => getDefault().concat(cardsApi.middleware),
  });
}

/** Read the current cached `getCards` result out of the store (test/debug helper). */
export function selectCards(
  store: ReturnType<typeof makeCardsStore>,
): Card[] | undefined {
  return cardsApi.endpoints.getCards.select()(store.getState()).data;
}
