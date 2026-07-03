# React performance — minimizing re-renders

A component re-renders when: its own state/props change, its parent re-renders, or a
context it consumes changes value. Most "slow React" is **wasted re-renders** — children
re-rendering when nothing they depend on changed. The playbook:

## 1. Stable identities + `React.memo`

Inline objects/arrays/functions are a **new reference every render**, so a memoized child
sees "changed props" and re-renders anyway.

- Wrap pure children in `React.memo`.
- Give them **stable props**: `useCallback(fn, deps)` for handlers, `useMemo(() => obj, deps)`
  for objects/arrays.
- Taught + tested in module 07 task 4 (a bump to unrelated parent state must NOT re-render
  the memoized child).

## 2. `useMemo` for expensive computation

Cache a costly derivation (`useMemo(() => heavy(list), [list])`) so it only recomputes when
inputs change. Don't memo trivially-cheap values — the bookkeeping can cost more.

## 3. Split context (state vs setter)

A context re-renders **all** its consumers when its value changes. Keep the frequently-
changing value and the stable setter in **separate contexts** so setter-only consumers
never re-render on a value change. Pass `children` through the provider so the provider's
own state change doesn't re-render them. Taught + tested in module 07 task 2.

## 4. Colocate / derive state

Keep state as low in the tree as possible; lifting it re-renders more. Derive values during
render instead of mirroring them into extra state.

## 5. Stable keys

Use stable, identity-based `key`s (an id, not the array index) so React reuses DOM nodes
across reorders instead of re-rendering everything.

## 6. External stores + selectors

For global/server state, `useSyncExternalStore` (module 13) and TanStack Query selectors
(module 14) subscribe a component to just the slice it needs — a re-render fires only when
that slice changes. From-scratch versions: modules 13b, 14b.

## 7. Windowing / virtualization

For long lists, render only visible rows (module 08) so the DOM (and render cost) stays
bounded regardless of data size.

**Measure, don't guess:** the React DevTools Profiler shows which components rendered and
why (module 28b — Debugging & Profiling).
