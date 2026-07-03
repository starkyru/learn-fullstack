# Module 08b — React Advanced Patterns 🟡 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The patterns component-library authors ship so their components stay flexible without a thousand
props: render-as-anything **polymorphic** components, an inverted-control **state reducer**, and
**headless** hooks that hand you **prop getters** instead of markup. Finish this and Radix/Downshift/
Chakra APIs read like things you have already written.

## Concepts

- **Polymorphic `as` prop** — a generic `E extends ElementType` plus `ComponentPropsWithoutRef<E>`
  lets one component render as any element while type-checking that element's props (`<Box as="a">`
  accepts `href`; `<Box as="button">` accepts `type`/`disabled`). Runtime is trivial: pick the
  element, spread the rest onto it.
- **State-reducer pattern** — the hook owns a reducer that computes the DEFAULT next state, then
  defers to an optional consumer `stateReducer(state, action)` before committing. The action carries
  the proposed `changes`, so the consumer can veto a transition or override a single field without
  forking the component. This is how Downshift lets you keep a menu open after a select.
- **Headless components + prop getters** — a headless hook owns state and ARIA wiring but renders
  nothing, so it drives many UIs. It exposes **prop getters** (`getButtonProps`/`getPanelProps`) that
  MERGE the hook's behaviour onto the caller's props — composing a caller `onClick` with the internal
  toggle rather than clobbering it, and filling `aria-expanded`/`aria-controls`/`id`/`hidden`.

## Tasks

| #   | Task                  | Lane | Type | Build                                                                 |
| --- | --------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Polymorphic component | 🟡   | WE   | solved polymorphic `<Box as>` + analog `<Text as>` stub               |
| 2   | State-reducer pattern | 🔴   | FS   | a `useSelect` whose consumer can intercept/override transitions       |
| 3   | Prop getters + slots  | 🟡   | TODO | a headless `useDisclosure` returning `getButtonProps`/`getPanelProps` |

## Theory & docs

- **Polymorphic component** — [Using TypeScript (react.dev)](https://react.dev/learn/typescript),
  [Passing props to a component](https://react.dev/learn/passing-props-to-a-component)
- **State-reducer pattern** — [Extracting state logic into a reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer),
  [`useReducer`](https://react.dev/reference/react/useReducer)
- **Prop getters + slots** — [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks),
  [Disclosure pattern (ARIA APG)](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- **Background** — [ARIA Authoring Practices patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
  for the widget wiring headless hooks are expected to fill in

## Done when

- [ ] `<Box as="a">` type-checks `href` (polymorphic props via generics + `ComponentPropsWithoutRef`),
      and `Box`/`Text` render the chosen element and spread props onto it.
- [ ] `useSelect` takes an optional `stateReducer(state, action) => nextState` that the internal
      reducer defers to, so the consumer can veto/override a transition (keep the menu open on select,
      force the next highlighted index).
- [ ] The headless `useDisclosure` drives two different UIs: `getButtonProps` returns `{ onClick,
aria-expanded, aria-controls }`, `getPanelProps` returns `{ id, hidden }`, and both merge
      caller-supplied handlers/props (a caller `onClick` still fires alongside the internal toggle).

> **Worked example (WE):** the reference half (`Box`) is solved in BOTH `src/` and `solution/`; the
> analog (`Text`) throws `TODO` in `src/`. **From scratch (FS)** and **TODO** tasks throw in `src/` —
> implement each. Tests import from `solution/`; flip to `../src/...` to grade your own build.
