# Module 07 — React Hooks II: Context, Memo & Custom Hooks

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Share state and factor logic into reusable hooks — and learn the React performance
best-practices for **minimizing re-renders** along the way.

## Concepts

- **Custom hooks** — extract stateful logic (`useLocalStorage`, `useDebounce`) into a
  reusable function; a hook is just a function that calls other hooks.
- **`useContext` + provider** — share state without prop-drilling. **Best practice: split
  context** — keep the frequently-changing _value_ and the stable _setter_ in separate
  contexts so components that only dispatch don't re-render when the value changes. Passing
  `children` through a provider lets React skip re-rendering them on the provider's own
  state change.
- **Portals & `useImperativeHandle`** — render outside the DOM tree (`createPortal`) and
  expose an imperative API (`focus()`) to a parent via a ref.
- **Minimizing re-renders** (see `docs/REACT_PERFORMANCE.html`): stable prop identities
  (`useCallback`/`useMemo`) + `React.memo` stop a child re-rendering when unrelated parent
  state changes; `useMemo` caches expensive computations; don't create objects/arrays/
  functions inline as props to memoized children.

## Tasks

| #   | Task                        | Lane | Type | What you build                                                                         |
| --- | --------------------------- | ---- | ---- | -------------------------------------------------------------------------------------- |
| 1   | Custom hook                 | 🟢   | WE   | solved `useLocalStorage` + analog `useDebounce`                                        |
| 2   | Context provider            | 🟡   | TODO | a **split-context** `ThemeProvider` so dispatch-only consumers don't re-render         |
| 3   | Portals & imperative handle | 🟡   | TODO | a `Modal` via `createPortal` exposing `focus()` through `useImperativeHandle`          |
| 4   | Memoization                 | 🟢   | EXT  | fix a wasteful parent/child with `React.memo` + `useCallback` (prove no wasted render) |

## Theory & docs

- **Custom hook** —
  [Reusing Logic with Custom Hooks (react.dev)](https://react.dev/learn/reusing-logic-with-custom-hooks),
  [useEffect (react.dev)](https://react.dev/reference/react/useEffect)
- **Context provider** — [useContext (react.dev)](https://react.dev/reference/react/useContext),
  [Passing Data Deeply with Context (react.dev)](https://react.dev/learn/passing-data-deeply-with-context),
  [Scaling Up with Reducer and Context (react.dev)](https://react.dev/learn/scaling-up-with-reducer-and-context)
- **Portals & imperative handle** —
  [createPortal (react.dev)](https://react.dev/reference/react-dom/createPortal),
  [useImperativeHandle (react.dev)](https://react.dev/reference/react/useImperativeHandle)
- **Memoization** — [memo (react.dev)](https://react.dev/reference/react/memo),
  [useCallback (react.dev)](https://react.dev/reference/react/useCallback),
  [useMemo (react.dev)](https://react.dev/reference/react/useMemo)
- **Render model (background)** —
  [Render and Commit (react.dev)](https://react.dev/learn/render-and-commit)

## Done when

- [ ] `useDebounce` returns the latest value only after the delay elapses.
- [ ] a component using only the theme **setter** does NOT re-render when the theme changes.
- [ ] `modalRef.current.focus()` moves focus to the modal's close button (rendered in a portal).
- [ ] bumping unrelated parent state does NOT re-render the memoized child.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
