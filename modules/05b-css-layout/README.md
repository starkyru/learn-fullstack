# Module 05b — CSS & Modern Layout 🟡 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Style UIs by hand — Flexbox/Grid, container queries, custom-property theming, `clamp()` fluid
type, animations, reduced-motion — with no Tailwind and no UI kit. CSS paints in a browser, but
every real styling call is a **decision**: which classes/values to emit, which layout a width
selects, which theme applies, whether to animate. This module extracts those decisions as pure
functions you can unit-test with exact assertions, and ships the matching hand-written CSS as
`artifacts/` you read alongside.

## Concepts

- **A layout is a composer** — `options → { className, style }`. The className a JSX `className=`
  receives and the inline-style object a `style=` receives are plain data. Flexbox for a stacked
  board column, Grid for a card grid; assert the exact objects, let the browser paint them.
- **Responsiveness is a resolver** — a container query reflows a component by its **container**
  width, not the viewport. `pickLayout(width)` returns `stack | 2col | 3col` at exact thresholds;
  `fluidType(...)` builds the exact `clamp(min, slopeVw + intercept, max)` string that scales type.
- **A theme is one `--var` map** — `buildThemeVars(name)` returns `--color-* → value`; swap the map
  and every color swaps. `resolveTheme(prefersDark, override)` encodes the precedence: an explicit
  override beats the OS `prefers-color-scheme`; `"system"` defers to it.
- **Motion is gated** — `shouldAnimate(prefersReducedMotion)` returns the timing, and reduced motion
  collapses it to instant (`duration: 0`), which drops the keyframe animation to `none`.

## Tasks

| #   | Task                              | Lane | Type | What you build                                                                |
| --- | --------------------------------- | ---- | ---- | ----------------------------------------------------------------------------- |
| 1   | Flexbox + Grid layout             | 🟢   | WE   | solved board-column flex layout + analog card-grid stub                       |
| 2   | Responsive + container queries    | 🟡   | TODO | a layout that reflows by container width; fluid type with clamp()             |
| 3   | Theming with custom properties    | 🟢   | TODO | light/dark theme via CSS variables + prefers-color-scheme                     |
| 4   | Animations & motion               | 🟡   | TODO | keyframe card-drop + transitions; respect prefers-reduced-motion              |
| 5   | Layout from scratch, no framework | 🔴   | FS   | rebuild a real UI (modal + responsive board) in pure CSS — no Tailwind/UI kit |

## Artifacts

The visual pieces ship as hand-written CSS the module documents but the gate does **not** run (no
browser/GPU needed to grade):

- `artifacts/board.css` — the responsive board grid, container queries, flex column, fluid title.
- `artifacts/theme.css` — the light/dark custom-property maps + `prefers-color-scheme` + override.
- `artifacts/modal.css` — the from-scratch overlay/dialog + `card-drop` keyframes + reduced-motion.

## Done when

- [ ] The resolvers return exact values at every breakpoint: `pickLayout` flips `stack → 2col` at
      480 and `2col → 3col` at 768 (inclusive lower bound); `fluidType` emits the exact `clamp(...)`.
- [ ] The theme swaps via one custom-property map: `buildThemeVars("dark")` differs from `"light"`,
      and `resolveTheme` lets an explicit override win over `prefers-color-scheme`.
- [ ] Reduced motion collapses to instant: `shouldAnimate(true)` is `duration 0`, `transition` is
      `0ms`, and `dropAnimation` becomes `{ animation: "none" }`.

> **Worked example (WE):** task 1's `boardColumn` is solved in `src/`; you write the analog
> `cardGrid`. **TODO / FS:** `src/` throws — implement each function. Tests import from `solution/`;
> flip an import to `../src/...` to grade your own build.
