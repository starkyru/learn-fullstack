# Module 12 — State Management I: Redux Toolkit

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Model complex client state with Redux Toolkit: slices + typed memoized selectors, async thunks
with loading/error lifecycle, RTK Query with cache tags + optimistic updates, and a custom
middleware written from scratch. Everything here is tested at the **store level** — dispatch an
action, assert the next state — so the concepts stay independent of any React binding.

## Concepts

- **Slices** — `createSlice` generates action creators + a reducer. Reducers look mutating but
  Immer makes them immutable under the hood; return-or-mutate, never both.
- **Memoized selectors** — `createSelector` caches on input identity: the output only recomputes
  when an input slice actually changes, so derived data (filtered/sorted) doesn't churn.
- **Async thunks** — `createAsyncThunk` dispatches `pending` / `fulfilled` / `rejected`; you handle
  each in `extraReducers` to drive a `status` + `error` state machine.
- **RTK Query** — `createApi` gives you a cache keyed by endpoint+args, `providesTags` /
  `invalidatesTags` for automatic refetch, and `onQueryStarted` for **optimistic updates** that
  roll back if the request fails.
- **Custom middleware** — `store => next => action => …` sees every action; you can log, debounce,
  or (here) record inverse patches to implement **undo**.

## Tasks

| #   | Task              | Lane | Type | What you build                                                           |
| --- | ----------------- | ---- | ---- | ------------------------------------------------------------------------ |
| 1   | Slice + selectors | 🟢   | WE   | solved `boardSlice` (+ memoized selectors) + analog `filtersSlice` stub  |
| 2   | Async thunks      | 🟡   | TODO | `loadBoard` via `createAsyncThunk` with pending/fulfilled/rejected state |
| 3   | RTK Query         | 🟡   | TODO | a cards API with cache tags, invalidation, and an optimistic add         |
| 4   | Custom middleware | 🔴   | FS   | an undo middleware that reverts the last board mutation                  |

## Theory & docs

- **Slice + selectors** — [`createSlice`](https://redux-toolkit.js.org/api/createSlice),
  [writing reducers with Immer](https://redux-toolkit.js.org/usage/immer-reducers),
  [deriving data with selectors](https://redux.js.org/usage/deriving-data-selectors).
- **Async thunks** — [`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk),
  [Redux Essentials: async logic and data fetching](https://redux.js.org/tutorials/essentials/part-5-async-logic).
- **RTK Query** — [overview](https://redux-toolkit.js.org/rtk-query/overview),
  [automated re-fetching with tags](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching),
  [manual cache updates & optimistic updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates).
- **Custom middleware** — [writing custom middleware](https://redux.js.org/usage/writing-custom-middleware),
  [middleware deep dive](https://redux.js.org/understanding/history-and-design/middleware),
  [implementing undo history](https://redux.js.org/usage/implementing-undo-history).
- Background — [Redux Essentials: overview & concepts](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
  and the [Redux style guide](https://redux.js.org/style-guide/) for the "why" behind the patterns.

## Done when

- [ ] `boardSlice` adds/moves/removes cards; `selectVisibleCards` is memoized (same inputs → same
      array reference) and `filtersSlice` mirrors the pattern.
- [ ] `loadBoard` sets `status: "loading" → "succeeded"` on success and `"failed"` + `error` on
      rejection, driven entirely by `extraReducers`.
- [ ] the cards API refetches after a mutation invalidates its tag, and an optimistic add shows
      immediately then rolls back when the server rejects.
- [ ] dispatching `undo()` reverts the most recent board mutation and is a no-op with empty history.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
