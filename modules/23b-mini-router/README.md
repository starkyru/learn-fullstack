# Module 23b — Build a Mini File-Based Router 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Understand file-based routing and nested layouts by building one — no router library. You fold an
in-memory "file tree" into a matchable route table, resolve dynamic params against a pathname, and
drive it all with the History API so Back/Forward re-render the right page. Finishing this makes the
`routes/` folders in Next.js / Remix / SvelteKit feel like something you already wrote.

## Concepts

- **A route table is a fold over a file tree** — each `page` file becomes a route; its URL segments
  come from the directory path, where `[id]` is a DYNAMIC segment and `[...slug]` is a CATCH-ALL. A
  route also remembers its `paramNames` and a `score`, so the table can be sorted most-specific first.
- **Matching is segment-by-segment, with static beating dynamic** — a static segment must equal the
  path part; a dynamic segment captures one part into `params`; a catch-all swallows the rest. Because
  the table is sorted by specificity, returning the FIRST match makes `/cards/new` win over `/cards/[id]`.
- **Nested layouts wrap the matched page** — a page's `layoutChain` is every layout whose directory is
  an ancestor of the page's, ordered root→leaf. The renderer nests them outermost-first around the page.
- **Navigation is the History API** — `navigate` does `pushState` + render; a `popstate` (Back/Forward)
  re-reads the location and re-renders the previous match. Inject the history + a location getter so the
  whole thing stays deterministic and testable.

## Tasks

| #   | Task              | Lane | Type | What you build                                            |
| --- | ----------------- | ---- | ---- | --------------------------------------------------------- |
| 1   | Route table       | 🔴   | FS   | scan a `routes/` tree into a matchable table              |
| 2   | Matcher + params  | 🔴   | FS   | match `/cards/:id`, extract params, pick the layout chain |
| 3   | Client navigation | 🔴   | FS   | History API + render the matched layout+page              |

## Done when

- [ ] `buildRouteTable` converts `[id]` → dynamic and `[...slug]` → catch-all, resolves each page's
      root→leaf `layoutChain`, and returns routes sorted most-specific first.
- [ ] `matchRoute` resolves dynamic params, normalizes a trailing slash, lets a static route beat a
      dynamic one, surfaces the matched `layoutChain`, and returns `null` on no match.
- [ ] `createRouter` pushes history + renders the matched page wrapped in its layouts (outermost-first),
      re-renders the previous match on Back/Forward (popstate), and exposes `current()`.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
