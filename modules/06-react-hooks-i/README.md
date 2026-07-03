# Module 06 — React Hooks I: State, Refs & Effects

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The core stateful hooks and their timing: `useState`, `useReducer`, `useRef`,
`useLayoutEffect`, `useId`.

## Concepts

- **`useReducer`** — when state transitions get complex (a board with add/move/rename), a
  reducer `(state, action) => state` is clearer and more testable than scattered setters.
- **`useRef`** — a mutable box that survives renders without causing them; great for holding
  the _previous_ value or a DOM node.
- **`useLayoutEffect`** — runs synchronously after DOM mutation, before paint; use it to
  measure/position so the user never sees a flicker (`useEffect` runs after paint).
- **`useId`** — generates an SSR-stable id to wire a `<label htmlFor>` to its `<input>`.

## Tasks

| #   | Task                     | Lane | Type | What you build                                         |
| --- | ------------------------ | ---- | ---- | ------------------------------------------------------ |
| 1   | useReducer               | 🟢   | WE   | solved `useToggle` + analog `useCounter`               |
| 2   | useRef & useLayoutEffect | 🟡   | TODO | `usePrevious(value)` — the last value, via `useRef`    |
| 3   | useId in forms           | 🟢   | TODO | a `<Field>` linking `<label>` to `<input>` via `useId` |
| 4   | Reducer-driven board     | 🟡   | TODO | a pure `boardReducer` (add / rename / move card)       |

## Done when

- [ ] `useCounter` exposes `count` + `inc`/`dec`/`reset`.
- [ ] `usePrevious` returns `undefined` on first render, then the prior value.
- [ ] `<Field>`'s label `htmlFor` equals its input `id` (from `useId`).
- [ ] `boardReducer` handles `add`, `rename`, and `move` immutably.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
