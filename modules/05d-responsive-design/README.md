# Module 05d — Responsive Design 🟡 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The **principles** of responsive design, both ways: pure CSS **and** Tailwind. `05b` gave you the
mechanics (container queries, `clamp()` fluid type); this companion is the methodology — mobile-first
vs desktop-first, breakpoint strategy, intrinsic (content-out) layout that reflows with **zero**
media queries, modular type/space scales, and rem-based sizing for zoom. Every principle is
extracted as a **pure decision function** you unit-test with exact assertions, plus a hand-written
`artifacts/responsive.css` you read alongside. The companion theory doc is **`docs/RESPONSIVE.html`**
(open it in a browser — it has live, resizable CSS demos).

## Concepts

- **Mobile-first is a direction** — base styles are the phone; every breakpoint layers up with
  `min-width`. `minWidthQuery` builds that query; `maxWidthQuery` (desktop-first, `max-width`) is the
  counterpart you rarely want. Choosing the direction is a principle, not a default.
- **Intrinsic layout beats breakpoints** — `repeat(auto-fit, minmax(min, 1fr))` reflows by the
  container with no media query at all. `autoFitGrid` emits it; `columnsAt(width, min, gap)` is the
  same decision in numbers, so "how many columns here" is testable without a browser.
- **Scale, don't guess** — a **modular scale** grows type/space by a ratio per step so sizes stay in
  tune; **rem** (not px) makes the whole scale honor the user's root font-size and zoom.
- **Same principle, two toolchains** — Tailwind bakes the breakpoints into class prefixes
  (`sm:`/`md:`/`lg:`), all `min-width`; an unprefixed class is the mobile base. Pure CSS spells the
  same cascade by hand. Task 4 (🔴 no Tailwind) and task 5 (Tailwind) build the _same_ grid.

## Tasks

| #   | Task                              | Lane | Type | What you build                                                               |
| --- | --------------------------------- | ---- | ---- | ---------------------------------------------------------------------------- |
| 1   | Mobile-first breakpoints          | 🟢   | WE   | solved `minWidthQuery` + analog `maxWidthQuery` (desktop-first) stub         |
| 2   | Intrinsic grid (no media queries) | 🟡   | TODO | `autoFitGrid` string + `columnsAt(width,min,gap)` column-count math          |
| 3   | Fluid type & space scale          | 🟡   | TODO | `modularScale(base,ratio,step)` + `pxToRem` for zoom-safe sizing             |
| 4   | Pure-CSS responsive layout        | 🔴   | FS   | `sidebarMode` + hand-written `artifacts/responsive.css` — no Tailwind/UI kit |
| 5   | Tailwind responsive utilities     | 🟢   | EXT  | `responsiveGridClasses` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`   |

## Theory & docs

- **Responsive principles (live demos)** — `docs/RESPONSIVE.html` (mobile-first, breakpoint strategy,
  intrinsic design, units, fluid-vs-adaptive) · sibling `docs/THEMING.html`, `docs/STYLING.html`
- **Mobile-first breakpoints** —
  [Using media queries (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries),
  [Responsive design (MDN)](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- **Intrinsic grid** —
  [`minmax()` (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax),
  [auto-fill vs auto-fit (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Realizing_common_layouts_using_grids)
- **Fluid type & space** —
  [`clamp()` (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp),
  [rem / root em (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/length#rem)
- **Tailwind responsive** — [Responsive design (Tailwind)](https://tailwindcss.com/docs/responsive-design)
- **Background** — `modules/05b-css-layout` (container queries + `clamp` mechanics)

## Artifacts

- `artifacts/responsive.css` — the mobile-first app shell (drawer→fixed nav, intrinsic content grid,
  `clamp()` heading, `prefers-reduced-motion`) that task 4's `sidebarMode` decision matches.

## Done when

- [ ] `minWidthQuery("md")` is `@media (min-width: 768px)` and `maxWidthQuery("md")` is
      `@media (max-width: 767px)` (one pixel below, no overlap).
- [ ] `autoFitGrid(240, 16)` emits the `repeat(auto-fit, minmax(240px, 1fr))` grid, and
      `columnsAt(496, 240, 16)` is 2 while `columnsAt(495, 240, 16)` is 1.
- [ ] `modularScale(1, 1.25, 2)` is `1.5625` and `pxToRem(24)` is `"1.5rem"`.
- [ ] `sidebarMode` is `"drawer"` below 1024 and `"fixed"` at/above it, matching `artifacts/responsive.css`.
- [ ] `responsiveGridClasses({ base: 1, sm: 2, lg: 3 })` is `"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"`.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
