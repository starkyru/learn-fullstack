# Module 10 — Concurrent React, Suspense & React 19

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

React's concurrent features: suspend on data, catch failures, keep the UI responsive under
load, and show optimistic results — plus the React 19 primitives (`use`, `useOptimistic`).

## Concepts

- **Suspense + `use()`** — `use(promise)` suspends until the promise settles; the nearest
  `<Suspense fallback>` shows while pending. Pass the SAME promise instance across renders.
- **Error boundaries** — a class component (`getDerivedStateFromError`) is the only way to
  catch render/Suspense errors; hooks can't.
- **`useTransition` / `useDeferredValue`** — mark expensive updates low-priority so typing
  stays smooth. `startTransition` wraps the _update_ (and its `isPending` flag drives a busy
  state); `useDeferredValue` defers a _value_ you derive from. The urgent input update keeps
  the field responsive while the heavy result update runs in the background.
- **`useOptimistic`** — show a pending result immediately during an async action; React
  discards the optimistic layer when the action ends, so a failed action rolls back for free.
- **Concurrent pitfalls** — stale closures in effects (fix with the functional updater), and
  reading changing values without deps.

## Tasks

| #   | Task                               | Lane | Type | What you build                                                                 |
| --- | ---------------------------------- | ---- | ---- | ------------------------------------------------------------------------------ |
| 1   | Suspense + error boundary          | 🟢   | WE   | solved `<CardTitle>` reading a promise via `use()` + analog `<UserName>`       |
| 2   | `useTransition`/`useDeferredValue` | 🟡   | TODO | an async-search card list; input stays responsive, results run in a transition |
| 3   | `useOptimistic`                    | 🟡   | TODO | an optimistic "add card" that rolls back on failure                            |
| 4   | Concurrent pitfalls                | 🟢   | EXT  | fix a stale-closure interval counter (functional updater)                      |

## Theory & docs

- **Suspense + error boundary** — [`<Suspense>`](https://react.dev/reference/react/Suspense),
  [`use`](https://react.dev/reference/react/use),
  [Catching errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- **`useTransition`/`useDeferredValue`** — [`useTransition`](https://react.dev/reference/react/useTransition),
  [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)
- **`useOptimistic`** — [`useOptimistic`](https://react.dev/reference/react/useOptimistic)
- **Concurrent pitfalls** — [Updating state based on the previous state](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state),
  [Lifecycle of reactive effects](https://react.dev/learn/lifecycle-of-reactive-effects)

## Done when

- [ ] `<UserName>` suspends (fallback shows), then renders the resolved name; a rejected
      promise is caught by `<ErrorBoundary>`.
- [ ] `<FilterableCardList>` filters by the typed query (case-insensitive) and marks the list
      `aria-busy` while the search transition is in-flight, clearing it when results settle.
- [ ] the optimistic card appears on submit and is kept on success but rolled back (with an
      error shown) on failure.
- [ ] `<AutoCounter>` counts past 1 (proves the functional updater), and clears its interval
      on unmount.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
