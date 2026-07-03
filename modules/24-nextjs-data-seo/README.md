# Module 24 — Next.js Data, Rendering & SEO

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

How the App Router turns data into fast, cacheable, well-ranked pages: a tag-based fetch
cache you can invalidate on demand, streaming a slow section behind a Suspense boundary,
static generation with ISR + per-route metadata/OG images, and the `next/image` /
`next/font` optimizations that move your LCP. Next's runtime isn't unit-testable directly,
so every task **extracts the logic** into pure functions / plain components you assert
against — no dev server required.

## Concepts

- **Tagged fetch cache + `revalidateTag`** — Next memoizes `fetch` by key and lets you
  attach `tags`; `revalidateTag(tag)` evicts exactly the entries carrying that tag so the
  next read refetches while everything else stays cached. Model it as a `Map` + an injected
  clock for TTL and the whole contract is deterministic.
- **Streaming with Suspense** — the static shell streams immediately; a slow child reads its
  data with `use(promise)` and suspends, so the nearest `<Suspense fallback>` shows until the
  promise resolves, then the content replaces it. Fallback → content is the whole demo.
- **SSG/ISR + metadata** — a marketing page is statically generated, refreshed in the
  background every `revalidate` seconds (ISR), and its `<head>` comes from a pure
  `generateMetadata` returning `{ title, description, openGraph: { images } }`; the OG image
  is just a URL you build.
- **Image/font optimization** — `next/image` builds a responsive `srcset` + `sizes` and marks
  the LCP hero `priority` (eager + high fetch priority); `next/font` self-hosts with
  `display: swap` and a CSS variable to kill layout shift. Both are string/object builders.

## Tasks

| #   | Task                       | Lane | Type | What you build                                            |
| --- | -------------------------- | ---- | ---- | --------------------------------------------------------- |
| 1   | Fetch caching & revalidate | 🟢   | WE   | solved cached board fetch + analog revalidateTag stub     |
| 2   | Streaming with Suspense    | 🟡   | TODO | stream the slow activity feed while the board renders     |
| 3   | SSG/ISR + metadata         | 🟢   | TODO | static marketing page + ISR + generateMetadata + OG image |
| 4   | Image/font optimization    | 🟢   | EXT  | next/image + next/font; measure LCP before/after          |

## Theory & docs

- **Fetch caching & revalidate** —
  [Next.js `fetch`](https://nextjs.org/docs/app/api-reference/functions/fetch),
  [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- **Streaming with Suspense** — [react.dev `<Suspense>`](https://react.dev/reference/react/Suspense),
  [react.dev `use`](https://react.dev/reference/react/use),
  [`loading.js` (streaming)](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- **SSG/ISR + metadata** —
  [Next.js ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration),
  [`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
  [route segment config (`revalidate`)](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- **Image/font optimization** —
  [`next/image`](https://nextjs.org/docs/app/api-reference/components/image),
  [`next/font`](https://nextjs.org/docs/app/api-reference/components/font),
  [MDN responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images)
- Background: [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) — the
  standard semantics Next's data cache builds on.

## Done when

- [ ] `cachedFetch` calls the fetcher once per key and reuses the value; `revalidateTag(tag)`
      forces a refetch of **only** the tagged keys, and TTL expiry follows the injected clock.
- [ ] `BoardWithFeed` paints the `Sprint Board` shell immediately, shows the fallback while the
      feed promise is pending, and streams the activity list in when it resolves.
- [ ] `generateMetadata` returns the exact `{ title, description, openGraph: { images } }`
      object, the OG image URL encodes its params, and the ISR config revalidates hourly.
- [ ] `optimizeImage` emits the exact `srcSet`/`sizes` and marks the LCP hero eager + high
      priority (non-priority images lazy + auto); `displayFont` uses `display: swap` + a var.

> **Worked example (WE):** task 1 ships a solved `cachedFetch` in `src/`; you complete the
> sibling `revalidateTag`. **TODO:** tasks 2–3 throw in `src/` — implement each stub. **EXT:**
> task 4's `src/` mirrors the solution; extend it (e.g. a format/quality param) and its tests.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
