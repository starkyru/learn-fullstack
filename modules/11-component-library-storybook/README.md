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
- **Token tiers** — flat tokens don't scale. Layer them **primitive** (`indigo-600 = #4f46e5`) →
  **semantic** (`action = indigo-600`) → **component** (`button-bg = action`). Components reference a
  role, so reskinning (dark, a brand, high-contrast) is one edit at the semantic tier. See
  `docs/THEMING.html` for the whole landscape (CSS vars vs CSS-in-JS vs vanilla-extract/Panda vs kits).
- **DTCG build** — the W3C token JSON (`{ "$value", "$type" }`, `{alias}` refs) that Figma/Tokens
  Studio export. A build flattens the tree, resolves aliases, and emits CSS custom properties — the
  job Style Dictionary does, hand-rolled here.
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
| 7   | Semantic token tiers        | 🟡   | TODO | `resolveToken`/`resolveTokens` — primitive→semantic→component alias resolution   |
| 8   | Token build (DTCG)          | 🔴   | FS   | flatten + resolve W3C DTCG JSON → CSS vars, no `style-dictionary`                |

## Theory & docs

- **Primitives + stories** — [How to write stories](https://storybook.js.org/docs/writing-stories),
  [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf)
- **Tailwind preset + theming** — [Presets (Tailwind v3)](https://v3.tailwindcss.com/docs/presets),
  [Dark mode (Tailwind)](https://tailwindcss.com/docs/dark-mode),
  [Using CSS custom properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **Overlay components** — [`createPortal`](https://react.dev/reference/react-dom/createPortal),
  [Dialog (modal) pattern (ARIA APG)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- **Interaction tests** — [Play functions](https://storybook.js.org/docs/writing-stories/play-function),
  [Interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- **DataTable + styling compare** — [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks),
  [Styling with utility classes (Tailwind)](https://tailwindcss.com/docs/styling-with-utility-classes)
- **Consume in both apps** — [Importing and exporting components](https://react.dev/learn/importing-and-exporting-components)
- **Semantic token tiers** — `docs/THEMING.html` §2 (tiers) + §6 (choosing an approach),
  [Design tokens 101 (Figma)](https://www.figma.com/blog/design-tokens/)
- **Token build (DTCG)** — [Design Tokens Format (W3C DTCG)](https://tr.designtokens.org/format/),
  [Style Dictionary](https://styledictionary.com) (the library this 🔴 forbids),
  `docs/THEMING.html` §3
- **Background** — [Storybook docs](https://storybook.js.org/docs),
  [Tailwind CSS docs](https://tailwindcss.com/docs)

## Done when

- [ ] `<Button variant>` maps each variant to its classes and every `buttonStories` entry renders;
      `<Input>` mirrors it (label wired via `htmlFor`).
- [ ] `tokensToPreset` emits `theme.extend.colors.brand` pointing at `var(--brand)`, and
      `themeVars(tokens, "dark")` returns the dark palette keyed by CSS-variable name.
- [ ] `<Modal>` renders `role="dialog" aria-modal="true"`, traps Tab/Shift+Tab inside, closes on
      `Escape`, and restores focus to the element that opened it.
- [ ] the `modalPlay` function drives the mounted modal and asserts the trap + Escape-to-close.
- [ ] `useDataTable` sorts by a column (toggling asc/desc) and tracks a row-selection set; the
      `docs/STYLING.html` tradeoff note (Tailwind vs CSS Modules vs CSS-in-JS) is written.
- [ ] `<Toolbar>` renders library `Button`s and fires its callbacks — the consume shape both apps use.
- [ ] `resolveToken("button-bg", tokens)` walks component→semantic→primitive to its `{light,dark}`
      value, throws on an unknown name / alias cycle, and `resolveTokens` emits the `--name` map per scheme.
- [ ] `resolveDtcg` flattens a DTCG doc and resolves every `{alias}` (throwing on unknown/cyclic refs),
      and `toCssVars` renders `:root { --dashed-path: value; }` — no `style-dictionary`.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
