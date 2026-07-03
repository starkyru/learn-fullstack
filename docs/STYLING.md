# Styling tradeoffs: Tailwind vs CSS Modules vs CSS-in-JS

> Companion note for **module 11 — Component Library, Storybook & Tailwind**, task 5. The
> `useDataTable` hook (headless) is styled once each way; this is _why_ you'd pick one.

The behavior is identical (see `solution/05-datatable.ts`); only the skin changes. Pick per
constraint, not per fashion.

## The three approaches

| Aspect              | Tailwind (utility)                         | CSS Modules                             | CSS-in-JS (runtime, e.g. styled/emotion)             |
| ------------------- | ------------------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| Where styles live   | inline `className` utilities               | co-located `.module.css`, scoped hashes | JS template literals / style objects                 |
| Scoping             | global utilities, no leakage risk          | locally scoped by build                 | locally scoped by generated class                    |
| Theming             | design tokens → preset → **CSS variables** | CSS variables / `:root` overrides       | theme object via context (`ThemeProvider`)           |
| Dynamic/prop-driven | awkward (class permutations, `cn`)         | awkward (toggle classes)                | natural (props → styles)                             |
| Runtime cost        | **zero** (classes are static)              | zero (plain CSS)                        | non-zero: serialize + inject on render (RSC-hostile) |
| Bundle              | one shared utility sheet, purged           | per-component CSS, code-split           | JS grows with styles                                 |
| Learning curve      | memorize utilities; noisy markup           | plain CSS you already know              | new API + theme plumbing                             |

## When to use which

- **Tailwind** — default for app UI and a shared library skinned per app. Static classes mean
  **no runtime**, purge keeps the sheet tiny, and a token→preset→CSS-var pipeline (task 2) themes
  light/dark by swapping variables. Cost: verbose markup; extract repetition into components, not
  `@apply` soup.
- **CSS Modules** — reach for it when you want **plain CSS** with local scoping and zero runtime,
  or a design that's more "stylesheet" than "utilities." Great for a second app that shouldn't
  inherit the first app's Tailwind config. Cost: prop-driven variance is manual.
- **CSS-in-JS (runtime)** — only when styles are **genuinely dynamic from props** and colocated
  logic wins. Beware React Server Components: runtime CSS-in-JS needs a client boundary and adds
  per-render work. Prefer **zero-runtime** variants (vanilla-extract, or Tailwind) under RSC.

## Rule of thumb

Headless logic (a hook like `useDataTable`) should never care which of these renders it. Keep
behavior in hooks; keep styling swappable. If switching skins forces a logic change, the seam is
in the wrong place.
