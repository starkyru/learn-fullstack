# Module 14b — Build a Mini Query Client (TanStack-like) 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Rebuild the async-cache core that TanStack Query is famous for — no library. You build a keyed
query cache that DEDUPES concurrent fetches, a `useQuery` binding on `useSyncExternalStore`, and the
invalidation + optimistic-mutation machinery. When you finish, `@tanstack/react-query`'s
`useQuery`/`useMutation`/`invalidateQueries` feel like something you already wrote.

## Concepts

- **The cache is a keyed `Map` of entries** — each query key is serialized (`JSON.stringify`) to a
  string, and each entry holds `{ status, data, error, promise, updatedAt, isFetching, fetcher }`
  plus a `Set` of listeners. Every write REPLACES the entry with a fresh object, so
  `useSyncExternalStore`'s `Object.is` snapshot check detects the change.
- **`fetchQuery` is dedupe + freshness** — if an entry already has an in-flight `promise`, return
  it (two callers share one request). If the data is still fresh (`now() - updatedAt < staleTime`),
  return the cached value without calling the fetcher. Otherwise run the fetcher, stash the promise,
  and notify on resolve/reject.
- **Inject the clock** — freshness is time-based, so the client takes a `now()` function (default
  `Date.now`). Tests pass a fake clock and drive it by hand; the code never reaches for `Date.now`
  or `Math.random` directly.
- **Invalidation + optimistic mutation** — `invalidate(key)` marks an entry stale and refetches it
  IF something is actively subscribed. A mutation applies an optimistic update via `onMutate`,
  rolls back to the exact previous value if `mutationFn` rejects, and invalidates keys on settle.

## Tasks

| #   | Task                | Lane | Type | Build                                                          |
| --- | ------------------- | ---- | ---- | -------------------------------------------------------------- |
| 1   | Query cache + fetch | 🔴   | FS   | keyed cache; dedupe concurrent fetches                         |
| 2   | `useQuery` hook     | 🔴   | FS   | subscribe via `useSyncExternalStore`; expose status/data/error |
| 3   | invalidate + mutate | 🔴   | FS   | invalidation + optimistic mutation with rollback               |

## Theory & docs

This is a 🔴 from-scratch module — build on the primitives below; TanStack Query pages are listed
only as CONCEPT reading (what staleness/invalidation should mean), never as an implementation crib.

- **Query cache + fetch** —
  [`Map` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map),
  [`Promise` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise),
  [`JSON.stringify` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
- **`useQuery` hook** —
  [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore),
  [`Object.is` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
- **invalidate + mutate** — concept reading:
  [important defaults (staleness)](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults),
  [optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).
- Background —
  [`Promise.prototype.finally` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)
  for the settle step that always invalidates, success or failure.

## Done when

- [ ] Two `fetchQuery` calls for the SAME key while one is in flight call the fetcher ONCE and both
      resolve to the same data; a fresh cache hit within `staleTime` skips the fetcher, past it
      refetches (driven by the injected clock).
- [ ] `useQuery(client, key, fn)` exposes `{ status, data, error, isFetching }`; two mounted
      components sharing a key trigger one fetch and both render the data, and each unsubscribes on
      unmount (no listener leak).
- [ ] `invalidate(key)` refetches active subscribers and notifies them; an optimistic `mutate` sets
      the data immediately and rolls back to the exact previous value when `mutationFn` rejects.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
