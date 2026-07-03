# Module 07b — Hand-Rolled Hooks 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Demystify React hooks by building a tiny React-like renderer from scratch — a hooks array plus a
dispatcher, no real React. You control the whole runtime: a component is just a function, its memory
is an array of hook cells on a per-component fiber, and a cursor that resets to 0 each render binds
each hook call to its cell by ORDER. Once you've written `useState`, `useEffect`, `useMemo`, and
`useRef` this way, the "rules of hooks" stop being a lint rule and become an obvious consequence of
the implementation.

## Concepts

- **A hook is a cell in an array, matched by call order** — each render resets a `cursor` to 0 and
  every hook reads/creates `hooks[cursor++]`. That is the entire "how does React remember?" story.
  Calling a hook conditionally shifts every later hook onto the wrong cell — _that_ is why the rules
  of hooks exist. There is no magic, only a stable index.
- **`setState` is a write + a schedule** — it writes the cell and re-invokes the component (reset
  cursor, run, flush effects). An `Object.is`-equal value bails out with no re-render. A functional
  updater `(prev) => next` reads the latest cell value, so it composes correctly.
- **Effects and memos are deps compares over a remembered array** — `useEffect` runs its callback
  after the render only when `depsChanged` (element-wise `Object.is`), running the previous cleanup
  first; `useMemo` recomputes only on a deps change and otherwise returns the SAME reference;
  `useRef` returns one persistent `{ current }` box whose mutation never re-renders.

## Tasks

| #   | Task                    | Lane | Type | Build                                                   |
| --- | ----------------------- | ---- | ---- | ------------------------------------------------------- |
| 1   | `useState` from scratch | 🔴   | FS   | a mini renderer with a hooks array + working `useState` |
| 2   | `useEffect` + deps      | 🔴   | FS   | effect scheduling with dependency compare + cleanup     |
| 3   | `useMemo`/`useRef`      | 🔴   | FS   | memo cell + persistent ref cell                         |

## Done when

- [ ] A counter component re-renders via your dispatcher: `useState` returns `[value, setState]`,
      `setState` schedules exactly one re-render, and an `Object.is`-equal value bails out.
- [ ] `useEffect` runs once on mount, again only when a dep changes, runs the previous cleanup before
      re-running, and runs cleanup on unmount; no-deps runs every render, empty-deps runs once.
- [ ] `useMemo` recomputes only on a dep change (stable reference otherwise); `useRef` keeps a stable
      `{ current }` box across renders and mutating it never re-renders.
- [ ] You can explain the rules of hooks as an implementation constraint: stable hook order → the
      cursor indexes into the hooks array.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
