# Module 05 — React Core

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Render UIs from components, props, and state — the foundation everything else builds on.

## Concepts

- **Components & props** — a component is a function of props → JSX. Keep them pure and
  presentational where you can.
- **Lists & keys** — render arrays with `.map`; a stable `key` lets React match items across
  renders (never use the array index when items reorder).
- **State & effects** — `useState` holds local state (update immutably); `useEffect` runs
  side effects (data fetching) and must clean up to avoid setstate-after-unmount.
- **Variants → stories** — building each component's variants up front makes it trivial to
  add a Storybook story in module 11.

## Tasks

| #   | Task                 | Lane | Type | What you build                                                                         |
| --- | -------------------- | ---- | ---- | -------------------------------------------------------------------------------------- |
| 1   | Components & props   | 🟢   | WE   | solved `<Card>` + analog `<Badge>` stub                                                |
| 2   | Lists, keys & state  | 🟢   | TODO | a `<CardList>` that adds/removes cards with `useState`                                 |
| 3   | Effects & data fetch | 🟡   | TODO | a `useBoardName` hook: fetch in `useEffect` with loading/error + cleanup               |
| 4   | Component variants   | 🟢   | WE   | solved `cardVariants` example map + analog `badgeVariants` (story-ready for module 11) |

## Theory & docs

- **Components & props** — [Your First Component (react.dev)](https://react.dev/learn/your-first-component),
  [Passing Props to a Component (react.dev)](https://react.dev/learn/passing-props-to-a-component)
- **Lists, keys & state** — [Rendering Lists (react.dev)](https://react.dev/learn/rendering-lists),
  [State: A Component's Memory (react.dev)](https://react.dev/learn/state-a-components-memory),
  [Updating Arrays in State (react.dev)](https://react.dev/learn/updating-arrays-in-state)
- **Effects & data fetch** — [Synchronizing with Effects (react.dev)](https://react.dev/learn/synchronizing-with-effects),
  [useEffect (react.dev)](https://react.dev/reference/react/useEffect)
- **Component variants** — [Keeping Components Pure (react.dev)](https://react.dev/learn/keeping-components-pure),
  [How to write stories (Storybook)](https://storybook.js.org/docs/writing-stories)

## Done when

- [ ] `<Badge>` renders its label and variant class like `<Card>` does.
- [ ] `<CardList>` adds a card on submit and removes one on click, updating state immutably.
- [ ] `useBoardName` returns `{ loading, error, name }`; loading → resolved, and it doesn't
      set state after unmount.
- [ ] `badgeVariants` lists every variant with example props.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
