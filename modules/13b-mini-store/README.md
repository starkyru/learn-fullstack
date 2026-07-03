# Module 13b — Build a Mini Store (Zustand-like) 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Implement the external-store pattern from scratch — no library. You build the exact contract
`useSyncExternalStore` consumes (`subscribe` / `getState` / `setState`), the React binding with
selector equality, and `persist` + `devtools` middleware. The API mirrors Zustand's shape, so
finishing this makes module 13's `zustand` import feel like something you already wrote.

## Concepts

- **The store is a closure** — `state` + a `Set` of listeners. `setState` shallow-merges a partial
  (or an updater fn) and notifies; `subscribe` returns an unsubscribe. That is the whole "external
  store" contract; the library is mostly ergonomics on top.
- **The React binding is equality caching** — `useSyncExternalStore` only knows `Object.is`, so to
  honor a custom `equalityFn` you cache the last `{ state, selected }` and return the OLD reference
  when the selected slice is still equal. That same caching (keyed by state identity) is what stops
  an object-returning selector from tripping React's infinite-loop guard.
- **Middleware is a `StateCreator` wrapper** — it takes an initializer and returns a new one,
  intercepting `set` (and, for `persist`, the initial state). They compose:
  `createStore(persist(devtools(init, { logger }), { name, storage }))`.

## Tasks

| #   | Task          | Lane | Type | What you build                                             |
| --- | ------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | `createStore` | 🔴   | FS   | `create()` with `get`/`set`/`subscribe`                    |
| 2   | React binding | 🔴   | FS   | `useStore(selector, equalityFn)` on `useSyncExternalStore` |
| 3   | Middleware    | 🔴   | FS   | a `persist` + `devtools`-style wrapper                     |

## Theory & docs

This is a 🔴 from-scratch module — the primitives below are the required reading; library docs are
reference-only for comparing your API shape afterwards.

- **`createStore`** — [closures (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures),
  [`Set` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set),
  [spread syntax for shallow merge (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).
- **React binding** —
  [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore),
  [`Object.is` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
- **Middleware** —
  [first-class functions (MDN)](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function),
  [Web Storage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API),
  [`JSON.parse` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse).
- After you've built it, compare your contract against the real thing:
  [Zustand `createStore`](https://zustand.docs.pmnd.rs/apis/create-store) and
  [persisting store data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data).

## Done when

- [ ] `createStore` supports object + functional `setState`, shallow-merges (or `replace`s),
      notifies `(next, prev)`, and `subscribe` returns a working unsubscribe.
- [ ] `useStore(store, selector, equalityFn?)` re-renders only when the selected slice changes;
      `shallow` makes an object selector ignore unrelated updates and never loops.
- [ ] `persist` writes to injected `storage` on every set and rehydrates the initial state (keeping
      actions, ignoring corrupt JSON); `devtools` logs each post-set state to an injected logger.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
