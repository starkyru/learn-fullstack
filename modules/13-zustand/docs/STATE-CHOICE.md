# When to use which: Redux Toolkit vs Zustand vs Context

The same counter is built three ways in `solution/04-compare.tsx`. Behavior is identical; the cost
model is not. This note is the deliverable for task 4.

## The shape of each

| Axis                   | Redux Toolkit                        | Zustand                           | Context + `useReducer`               |
| ---------------------- | ------------------------------------ | --------------------------------- | ------------------------------------ |
| State lives in         | a store, updated by reducers         | a store closure, mutated by `set` | a provider's `useReducer` state      |
| How you write it       | slices → actions → reducers          | actions co-located with state     | reducer + provider + context         |
| Reading a value        | `useSelector` (memoized)             | `useStore(store, selector)`       | `useContext` (whole value)           |
| Re-render isolation    | selector-level (built in)            | selector-level (`+ useShallow`)   | **none** — every consumer re-renders |
| Dependency             | `@reduxjs/toolkit` + `react-redux`   | `zustand` (tiny)                  | zero (built into React)              |
| DevTools / time-travel | first-class                          | opt-in middleware                 | roll your own                        |
| Middleware / async     | thunks, RTK Query, custom middleware | middleware (persist, immer, …)    | none — you compose it yourself       |

## The rule of thumb

- **Context + `useReducer`** — small, rarely-changing, or tree-local state (theme, current user,
  a form wizard). Zero deps. The catch: **every consumer re-renders on any change**, because the
  context value is one object. Fine when the state changes seldom; a footgun for hot state.
- **Zustand** — most client global state. Selector-level re-render isolation without boilerplate,
  a store you can read/write outside React, and `persist` in one line. Reach here first when
  Context's re-render fan-out starts to hurt.
- **Redux Toolkit** — large apps that need the ecosystem: DevTools time-travel, a normalized cache
  with tag invalidation (RTK Query), strict action logs for debuggability, or a big team that
  benefits from the enforced action/reducer structure. The ceremony buys traceability.

## Decision path

1. State is local to a subtree and changes rarely → **Context**.
2. Global client state, want minimal ceremony + re-render isolation → **Zustand**.
3. Need DevTools/time-travel, a server-cache layer, or team-scale conventions → **Redux Toolkit**.

Server state (data you fetch) is a different question — that is TanStack Query / RTK Query, not any
of these three. Do not keep server data in a client store you hand-invalidate.
