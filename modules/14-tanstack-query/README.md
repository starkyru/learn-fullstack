# Module 14 — Server State: TanStack Query & Ecosystem 🟢🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Module 14b had you REBUILD the async-cache core; this module uses the real thing. `@tanstack/react-query`
turns "server state" — data you don't own, that goes stale, that many components read — into declarative
cache entries: keyed queries that dedupe and refetch, mutations that invalidate or optimistically patch,
SSR hydration that skips the loading flash. Then a quick tour of the sibling libraries you'll actually
reach for: a headless **Table** and a taste of typed **Router** params + **Form** validation.

## Concepts

- **A query is `{ queryKey, queryFn }`** — every component reading the same key shares ONE deduped
  cache entry. `useMutation` wraps a write; on success you `invalidateQueries(key)` to mark it stale
  and refetch the active subscribers, so the list reconciles to the server's truth.
- **Optimistic updates are a four-step dance** — `onMutate` cancels in-flight refetches, snapshots
  the cache, and patches it immediately; `onError` restores the snapshot; `onSettled` invalidates so
  the SERVER's value wins. `useInfiniteQuery` keeps `data.pages` and appends via `fetchNextPage`.
- **SSR = prefetch → dehydrate → hydrate** — prefetch on the server into a throwaway client,
  `dehydrate` the cache to serializable state, ship it, then `hydrate` (via `HydrationBoundary`) into
  the browser client. With a fresh `staleTime`, the first render has the data and nothing refetches.
- **The ecosystem is headless** — `@tanstack/react-table` owns the row/sort MODEL, you own the markup;
  `@tanstack/react-form` colocates per-field validators; the Router's pitch is TYPE-SAFE params.

## Tasks

| #   | Task                       | Lane | Type | Build                                                                                             |
| --- | -------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------------- |
| 1   | Queries & mutations        | 🟢   | WE   | solved useCards query + analog useLists stub; mutation invalidates                                |
| 2   | Optimistic + infinite      | 🟡   | TODO | optimistic card move + infinite-scroll activity feed                                              |
| 3   | SSR hydration              | 🟡   | TODO | prefetch + dehydrate/hydrate in a Next route                                                      |
| 4   | TanStack Table             | 🟢   | WE   | solved sortable users table + analog cards-table stub                                             |
| 5   | TanStack Router/Form taste | 🟢   | TODO | one typed route + one form field (the library survey — distinct from the 23b from-scratch router) |

## Done when

- [ ] `useCards`/`useLists` render exactly the MSW data; after `useAddCard` the cards query refetches
      and shows the new SERVER card (proving `invalidateQueries` drove a real refetch).
- [ ] The move mutation shows the optimistic column immediately, reconciles to the server's canonical
      column on settle, and rolls back to the exact previous value on error; `fetchNextPage` appends
      the exact next activity page and stops when the cursor is null.
- [ ] `prefetchCards` → `dehydrate` → JSON → `hydrateCards` round-trips the exact data under the same
      key, and `HydratedCards` renders it on first render with the client `queryFn` never called.
- [ ] Clicking a table header sorts the rows to the exact order (numeric for Age/Priority, not string).
- [ ] `cardRoute.parseParams` yields typed params (`cardId` a number) and `buildPath` is its inverse;
      the survey field surfaces the exact validation error and submits only a valid handle.

## Testing notes

Tests drive the REAL hooks under a fresh `QueryClient` (`retry: false`) per test and intercept `fetch`
with MSW's `setupServer` — the network is the only mocked boundary. Optimistic timing is made
observable by delaying the MSW write handler (never `Date.now`/`Math.random` in the code under test).

> **Worked example (WE):** `src/` ships the reference (`useCards`, `UsersTable`) SOLVED plus a throwing
> analog stub (`useLists`, `CardsTable`) for you. **TODO:** `src/` throws — implement it. Tests import
> from `solution/`; flip to `../src/...` to grade your own build.
