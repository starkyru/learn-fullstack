# Module 24b — Next.js Advanced 🟡 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The App Router's advanced surface — parallel + intercepting routes, tag-based caching, and
Partial Prerendering on the edge — modeled as **pure, unit-testable logic**. The Next runtime
isn't unit-testable directly, so each concept is extracted to a plain function you can call with
real inputs and assert on real outputs. No dev server, no rendering — just the mechanics.

## Concepts

- **Parallel + intercepting routes** — a parallel route renders a named slot (`@modal`) alongside
  `children`; an intercepting route (`(.)cards/[id]`) hijacks a navigation into that slot. The catch
  is the nav kind: a **soft** (`<Link>`) nav intercepts into the modal, but a **hard** nav
  (deep-link, refresh) bypasses interception and renders the real full page. That fork is the whole
  behaviour — `resolveRoute(path, nav, config)` returns `modal` vs `page` accordingly.
- **Tag-based caching** — one shared registry holds an entry per cache key, each tagged. A mutation
  calls `revalidateTag(tag)` and every entry carrying that tag goes stale **across all routes** at
  once, so a `/cards/42` mutation can invalidate both the `/cards/42` detail and the `/cards` list
  while leaving `/cards/7` fresh. A reverse `tag → keys` index makes it O(entries-for-that-tag).
- **PPR + edge** — Partial Prerendering ships a static **shell** instantly and streams the dynamic
  **holes** in after. A route is a list of segments (`static` HTML vs `dynamic` hole with a
  `fallback` + `resolve`); `renderShell` never awaits, `renderStreamed` fills the holes. The edge
  handler is a Web-standard `Request → Response` using only Web APIs — testable by calling it.

## Tasks

| #   | Task                           | Lane | Type | What you build                                           |
| --- | ------------------------------ | ---- | ---- | -------------------------------------------------------- |
| 1   | Parallel + intercepting routes | 🟡   | TODO | a modal route that intercepts card detail                |
| 2   | Advanced caching               | 🟡   | TODO | tag-based cache + revalidateTag across routes            |
| 3   | PPR/edge                       | 🟢   | EXT  | opt a route into PPR; move a handler to the edge runtime |

## Done when

- [ ] `resolveRoute("/cards/42", "soft")` renders the **modal** slot (`@modal`) but
      `resolveRoute("/cards/42", "hard")` renders the full **page** (`children`); a path with no
      interceptor is always a full page, and an unmatched path throws.
- [ ] `revalidateTag` invalidates **exactly** the tagged entries across routes — a scoped `card:42`
      tag hits only `/cards/42`, a shared `cards:list` tag hits every list-bearing route — and a
      stale entry reads as a cache miss (`get → undefined`) until re-set.
- [ ] the PPR route streams its dynamic hole: `renderShell` shows only the fallback, `renderStreamed`
      fills the hole with resolved HTML inside the static shell, and the edge `GET` returns the
      expected JSON `Response` with no Node APIs.

> **TODO tasks:** `src/` throws `TODO` — implement each function. **EXT tasks:** `src/` ships the
> full reference to read and extend. Tests import from `solution/`; flip to `../src/...` to grade
> your own build.
