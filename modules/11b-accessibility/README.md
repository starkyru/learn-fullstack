# Module 11b — Accessibility & WCAG (companion)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT
> Extends module 11 (the component library): every component in `packages/ui` must be
> accessible, so build the a11y primitives here and apply them there.

Accessibility isn't a bolt-on. Semantic HTML + ARIA make a UI usable with a screen reader;
sufficient color contrast makes it usable with low vision; focus management + keyboard
navigation make it usable without a mouse. WCAG 2.1 is the standard (levels A / AA / AAA).

## Concepts

- **Semantic HTML & ARIA** — prefer real elements (`<button>`, `<nav>`); when you can't,
  add roles/states (`aria-label`, `aria-pressed`, `aria-expanded`). The **first rule of
  ARIA**: don't use ARIA if a native element does the job.
- **Color contrast (WCAG)** — the contrast ratio between text and background must be ≥ **4.5:1**
  (AA, normal text) or **3:1** (AA, large text). Computed from relative luminance.
- **Focus management** — modals/menus must trap focus among their focusable children and
  restore it on close; a visible focus ring is required.
- **Keyboard navigation** — composite widgets (menus, tabs, listboxes) use a **roving
  tabindex** so arrow keys move between items.

## Tasks

| #   | Task                  | Lane | Type | What you build                                                              |
| --- | --------------------- | ---- | ---- | --------------------------------------------------------------------------- |
| 1   | Semantic HTML & ARIA  | 🟢   | WE   | solved `IconButton` (aria-label) + analog `ToggleButton` (aria-pressed)     |
| 2   | Color contrast (WCAG) | 🔴   | FS   | `contrastRatio(fg, bg)` + `meetsWCAG()` from the luminance formula — no lib |
| 3   | Focus management      | 🟡   | TODO | `getFocusableElements(container)` in DOM order (for a focus trap)           |
| 4   | Keyboard navigation   | 🟡   | TODO | `nextRovingIndex(current, key, count)` for arrow/Home/End                   |

## Theory & docs

- **Semantic HTML & ARIA** — [ARIA (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA),
  [Using ARIA (W3C — the first rule of ARIA)](https://www.w3.org/TR/using-aria/),
  [Button pattern (ARIA APG)](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- **Color contrast (WCAG)** — [Understanding contrast (minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html),
  [WCAG 2 quick reference](https://www.w3.org/WAI/WCAG21/quickref/)
- **Focus management** — [Developing a keyboard interface (ARIA APG)](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/),
  [Keyboard-navigable JavaScript widgets (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
- **Keyboard navigation** — [Developing a keyboard interface (ARIA APG)](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
  — roving tabindex is under "Keyboard navigation inside components"
- **Background** — [WCAG 2 overview (W3C WAI)](https://www.w3.org/WAI/standards-guidelines/wcag/),
  [Accessibility (MDN)](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Done when

- [ ] `ToggleButton` exposes `aria-pressed` and toggles it on click.
- [ ] `contrastRatio("#000","#fff")` is 21; `meetsWCAG` enforces the AA/AAA thresholds.
- [ ] `getFocusableElements` returns only focusable, non-disabled nodes in document order.
- [ ] `nextRovingIndex` wraps on arrows and jumps on Home/End.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
