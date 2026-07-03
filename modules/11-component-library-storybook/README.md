# Module 11 — Component Library, Storybook & Tailwind

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Ship a small design-system library: primitives with **stories** (CSF-style `args`), a **Tailwind
preset** driven by design tokens + CSS variables (light/dark), accessible **overlay** components,
**play/interaction tests**, and a **headless DataTable** you can style either way.

## Concepts

- **Stories (CSF)** — a story is data: `{ args, render }`. The same component renders in Storybook,
  in tests, and in play functions from one source of truth. Args are the knobs.
- **Tailwind preset + tokens** — design tokens (colors/space) compile to a Tailwind preset whose
  colors point at **CSS variables**, so one class (`bg-brand`) themes light/dark by swapping vars on
  a `[data-theme]` root — no rebuild, no duplicate classes.
- **Overlay a11y** — a Modal is `role="dialog" aria-modal`, traps focus, closes on `Escape`, and
  **restores focus** to the trigger. A Toast is `role="status"` (polite) so screen readers announce
  it without stealing focus.
- **Interaction tests** — a **play function** (`async ({ canvasElement }) => …`) drives the mounted
  story with Testing Library + user-event and asserts the result: the story _is_ the test fixture.
- **Headless UI** — a `useDataTable` hook owns sort/selection state and returns rows + handlers; the
  markup (Tailwind vs CSS Modules) is swappable skin over identical behavior.

## Tasks

| #   | Task                        | Lane | Type | What you build                                                                   |
| --- | --------------------------- | ---- | ---- | -------------------------------------------------------------------------------- |
| 1   | Primitives + stories        | 🟢   | WE   | solved `Button` (variants) + its stories; analog `Input` stub + stories          |
| 2   | Tailwind preset + theming   | 🟢   | TODO | `tokensToPreset` + `themeVars(tokens, scheme)` — colors as CSS vars, dark mode   |
| 3   | Overlay components          | 🟡   | TODO | `Modal` on a portal: focus trap, `Escape`, focus restore, `role="dialog"`        |
| 4   | Interaction tests           | 🟡   | TODO | a `play` function that tabs through the modal and asserts the focus trap + close |
| 5   | DataTable + styling compare | 🔴   | FS   | headless `useDataTable` (sort + row select) + the styling-tradeoff note          |
| 6   | Consume in both apps        | 🟢   | EXT  | a `Toolbar` that consumes `Button` — the shape each app wires in                 |

## Done when

- [ ] `<Button variant>` maps each variant to its classes and every `buttonStories` entry renders;
      `<Input>` mirrors it (label wired via `htmlFor`).
- [ ] `tokensToPreset` emits `theme.extend.colors.brand` pointing at `var(--brand)`, and
      `themeVars(tokens, "dark")` returns the dark palette keyed by CSS-variable name.
- [ ] `<Modal>` renders `role="dialog" aria-modal="true"`, traps Tab/Shift+Tab inside, closes on
      `Escape`, and restores focus to the element that opened it.
- [ ] the `modalPlay` function drives the mounted modal and asserts the trap + Escape-to-close.
- [ ] `useDataTable` sorts by a column (toggling asc/desc) and tracks a row-selection set; the
      `docs/STYLING.md` tradeoff note (Tailwind vs CSS Modules vs CSS-in-JS) is written.
- [ ] `<Toolbar>` renders library `Button`s and fires its callbacks — the consume shape both apps use.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
