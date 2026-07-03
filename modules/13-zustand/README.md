# Module 13 — State Management II: Zustand & External Stores

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Lightweight global state and the store contract behind it: a Zustand store where actions live with
state, selectors + `shallow` to stop unrelated re-renders, `useSyncExternalStore` to bridge state
that lives outside React, and a side-by-side of the same feature built three ways.

## Concepts

- **Zustand store** — state + actions in one closure with `getState` / `setState` / `subscribe`.
  Using `zustand/vanilla` keeps each store an isolated instance (no module singleton), so it tests
  with plain `.getState()` — no React required. Actions call `set(partial)`; the merge is shallow.
- **Selectors & slices** — `useStore(store, selector)` re-renders a component only when the
  **selected value** changes (`Object.is`). A primitive selector is already isolated; a selector
  that returns a fresh object needs **`useShallow`** to compare fields, not identity. Big stores
  split into independent slice creators that combine by spreading.
- **`useSyncExternalStore`** — the React-blessed bridge to anything outside React (window, media
  query, socket): `subscribe` wires a listener and **returns a cleanup** (or you leak one per
  unmount), `getSnapshot` reads synchronously, `getServerSnapshot` supplies the SSR value.
- **Redux vs Zustand vs Context** — the same counter three ways surfaces the trade-off: Redux's
  reducer/action ceremony, Zustand's co-located actions, Context's zero-dep-but-re-renders-all.
  The written call lives in `docs/STATE-CHOICE.md`.

## Tasks

| #   | Task                            | Lane | Type | What you build                                                          |
| --- | ------------------------------- | ---- | ---- | ----------------------------------------------------------------------- |
| 1   | Zustand store                   | 🟢   | WE   | solved theme/UI store + analog board-UI store stub                      |
| 2   | Selectors & slices              | 🟡   | TODO | split a store into slices; a selector + `shallow` that stops re-renders |
| 3   | Subscribe to an external source | 🟡   | TODO | bridge `window` size + a media query via `useSyncExternalStore`         |
| 4   | Redux vs Zustand vs Context     | 🟢   | EXT  | the same counter three ways + the "when to use which" note              |

## Done when

- [ ] `createThemeStore` toggles theme/sidebar and notifies subscribers; `createBoardUiStore`
      mirrors it (select / beginDrag / endDrag) and `endDrag` leaves selection untouched.
- [ ] `createAppStore` combines the counter + theme slices; a primitive selector ignores unrelated
      updates, and `useShallow` makes an object selector do the same.
- [ ] `useWindowWidth` reflects `innerWidth` and updates on resize; `useMediaQuery` tracks
      `matchMedia().matches`; both remove their listener on unmount.
- [ ] the three counters behave identically, and `docs/STATE-CHOICE.md` records the trade-off.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
