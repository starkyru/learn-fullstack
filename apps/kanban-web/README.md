# @learn-fullstack/kanban-web

Next.js **App Router** web front-end for the Kanban capstone (Trello-lite). This package is
an **M0+ vertical slice**, not the finished app: one board route rendered by a React Server
Component, one Server Action, and the Tailwind wiring — enough to be genuinely runnable and
fully covered by a typecheck + test gate that needs **no server, no DB, and no `next build`**.

## Stack

- **Next.js App Router + React Server Components** — `app/board/page.tsx` is an `async` RSC
  that fetches the board on the server and streams a zero-JS tree; interactivity is isolated
  to `"use client"` islands (`AddCardButton`).
- **Server Actions** — `createCardAction` (in `src/board/create-card-action.ts`) is the pure,
  dependency-injected core: `(input, { repo, revalidate })`, zod-validated, returns
  `{ ok: true, card } | { ok: false, error }`. The thin `"use server"` wrapper
  (`app/board/actions.ts`) binds the real repo + `revalidateTag`.
- **Tailwind CSS** — shared design tokens via `@learn-fullstack/config/tailwind-preset`;
  entry at `app/globals.css`, config in `tailwind.config.ts` + `postcss.config.mjs`.
- **TanStack Query** — declared for the client-side mutation/optimistic-update layer wired in
  a later milestone (see TODO M2).
- **Auth.js** — the Kanban capstone's chosen auth stack (session/OAuth); wired in M4.
- Reuses the shared spine: `@learn-fullstack/ui` (`Button`), `@learn-fullstack/shared` (the
  `User` wire contract), `@learn-fullstack/config` (Tailwind preset).

## Layout

```
app/
  layout.tsx            root layout + globals.css
  globals.css           @tailwind base/components/utilities
  board/
    page.tsx            async RSC route (composition root)
    actions.ts          "use server" wrapper binding boardStore + revalidateTag
src/board/
  board-service.ts      domain types + Web-standard in-memory BoardRepo (no running server)
  board-view.tsx        BoardView RSC (columns/cards) — no client JS
  add-card-button.tsx   "use client" island (reuses @learn-fullstack/ui Button)
  create-card-action.ts pure, injected-deps Server Action core (zod-validated)
test/                   vitest (jsdom): RSC tree, service, action
```

## Run (dev)

```bash
pnpm --filter @learn-fullstack/kanban-web dev     # http://localhost:3000/board
```

## Gate (what CI enforces here — no server / DB / next build required)

```bash
pnpm --filter @learn-fullstack/kanban-web exec tsc --noEmit
pnpm --filter @learn-fullstack/kanban-web exec vitest run
```

## Milestones (TODO)

- **M1 — Persistence:** replace `InMemoryBoardStore` with the Prisma `BoardRepo` from
  `@learn-fullstack/db`; bind it at the composition root in `app/board/page.tsx`.
- **M2 — Mutations + optimistic UI:** wire `AddCardButton`'s form to the `createCard`
  `"use server"` action; add TanStack Query for client-side optimistic card create/move.
- **M3 — Drag & drop:** reorder cards across columns; a `moveCardAction` mirroring the
  create-card pattern.
- **M4 — Auth.js:** session/OAuth sign-in; scope boards to `session.user`; protect the route.
- **M5 — Realtime:** live board updates (the capstone's WS layer) so collaborators see cards
  appear without a refresh.
- **M6 — Polish + deploy:** SEO metadata, loading/error UI, e2e (Playwright), Docker/CI.

```

```
