# Module 08 — React Patterns & Performance

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The reusable component patterns a library author ships, and how to keep React fast at
scale — windowing long lists and killing wasted re-renders (see `docs/REACT_PERFORMANCE.md`).

## Concepts

- **Compound components** — a parent shares state with its children through context
  (`<Tabs><Tabs.List/><Tabs.Panel/></Tabs>`), giving a flexible declarative API.
- **Render-props & HOC** — two older ways to share behavior: a component that calls a
  `render(state)` prop, and a higher-order component `withX(Component)` that wraps one.
- **Virtualization (windowing)** — render only the rows visible in the viewport, so a 10k-row
  list touches ~20 DOM nodes, not 10k.
- **Perf pass** — memoize (`React.memo` + stable props) so a row doesn't re-render when a
  sibling changes; measure with the Profiler (module 28b).

## Tasks

| #   | Task               | Lane | Type | What you build                                                                        |
| --- | ------------------ | ---- | ---- | ------------------------------------------------------------------------------------- |
| 1   | Compound component | 🟢   | WE   | solved `<Tabs>` compound API + analog `<Accordion>` stub                              |
| 2   | Render-props & HOC | 🟡   | TODO | a `<Toggle render>` + a `withDisabled(Component)` HOC                                 |
| 3   | Virtualized board  | 🔴   | FS   | `visibleRange()` windowing + a list that renders only visible rows — no react-window  |
| 4   | Perf pass          | 🟢   | EXT  | memoize a row so an unrelated list change doesn't re-render it (render-counter proof) |

## Theory & docs

- **Compound component** —
  [createContext (react.dev)](https://react.dev/reference/react/createContext),
  [Passing Data Deeply with Context (react.dev)](https://react.dev/learn/passing-data-deeply-with-context)
- **Render-props & HOC** —
  [Passing Props to a Component (react.dev)](https://react.dev/learn/passing-props-to-a-component),
  [Children (react.dev)](https://react.dev/reference/react/Children),
  [Reusing Logic with Custom Hooks (react.dev)](https://react.dev/learn/reusing-logic-with-custom-hooks)
- **Virtualized board** —
  [Element.scrollTop (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop),
  [scroll event (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event),
  [Rendering Lists (react.dev)](https://react.dev/learn/rendering-lists)
- **Perf pass** — [memo (react.dev)](https://react.dev/reference/react/memo),
  [useCallback (react.dev)](https://react.dev/reference/react/useCallback),
  [Profiler (react.dev)](https://react.dev/reference/react/Profiler)
- **Render model (background)** —
  [Render and Commit (react.dev)](https://react.dev/learn/render-and-commit)

## Done when

- [ ] `<Accordion>` toggles its panel via shared context like `<Tabs>` does.
- [ ] `<Toggle>` drives its UI through a render prop; `withDisabled` injects a `disabled` prop.
- [ ] `visibleRange` returns the correct start/end indices for a scroll offset; the list mounts
      only the visible rows.
- [ ] toggling one row does NOT re-render the other (memoized) rows.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
