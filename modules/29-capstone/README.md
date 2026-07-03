# Module 29 — Capstone Integration 🟡 FINAL

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The last module. You've built every piece in isolation — now assemble the **vertical slices** of the
two capstone apps and prove they hold together. This is an **integration** module: you don't rebuild
the full apps here, you build the SLICE LOGIC (services, guards, reducers, gateway, observability,
readiness) as plain, injectable TypeScript and unit/integration-test it. The two apps deliberately run
**different auth stacks** — Kanban on Auth.js/session, Chat on JWT/Passport — and that contrast is the
whole point: one capstone is not "more correct" than the other, they teach different tradeoffs.

## Concepts

- **A vertical slice is testable logic, not a running app.** A Server Action can't be unit-tested
  (it needs the Next server); a Nest WS gateway can't be unit-tested on a real port. So the slice's
  logic goes in a plain function/class that takes its true boundaries as **injected deps** — a
  repo, a session, a JWT secret, a clock, an id source, a telemetry sink — and a thin app wrapper
  binds the real ones. Tests bind fakes. No `Date.now()`, no `Math.random()`, no real sockets.
- **Optimistic UX = apply now, reconcile on settle.** `moveReducer` returns a NEW board with the
  card already moved; `runOptimisticMove` emits that instantly, then adopts the server's
  authoritative board when the action settles — or rolls back to the pre-move board if it fails.
  That pure core is exactly what a React `useOptimistic` reducer consumes (module 25).
- **Two auth stacks, one contract.** Kanban authorizes mutations with an Auth.js-style
  `requireSession(session)`; Chat authorizes every socket action with a `jose` JWT verified against
  an injected clock. Same goal (reject the unauthenticated caller before any work), different
  mechanism — compare, don't crown (`docs/AUTH_COMPARISON.md`).
- **Realtime = a store + a broadcast fan-out.** The gateway keeps `room → members` and pushes a
  posted message to that room's members ONLY. Each connection is a `useSocket`-style store
  (`subscribe`/`getSnapshot`) — the shape `useSyncExternalStore` consumes (module 22).
- **Ship-readiness is a check, not a vibe.** `checkAppsReady` inspects each slice (auth stack
  present, core actions wired, tests referenced) and reports an overall done/not-done plus the
  NAMED missing items — the same signal `/progress` surfaces.

## Tasks

| #   | Task                  | Lane | Type | What you build                                                   |
| --- | --------------------- | ---- | ---- | ---------------------------------------------------------------- |
| 1   | Kanban vertical slice | 🟢   | EXT  | board CRUD + drag-move (optimistic) + Auth.js, on packages/ui+db |
| 2   | Chat vertical slice   | 🟡   | EXT  | rooms + realtime messages (useSocket + gateway) + JWT auth       |
| 3   | Cross-cutting         | 🟡   | EXT  | tests (trophy), CI, deploy, observability wired for both         |
| 4   | Ship & document       | 🟢   | TODO | READMEs + /progress reports both apps pass                       |

## Theory & docs

- **Capstone specs** — this repo's [docs/CAPSTONES.md](../../docs/CAPSTONES.md), the briefs both
  slices integrate against.
- **Kanban stack** — [Next.js docs](https://nextjs.org/docs),
  [Server Components](https://react.dev/reference/rsc/server-components),
  [Prisma docs](https://www.prisma.io/docs), [Auth.js](https://authjs.dev/getting-started).
- **Chat stack** — [NestJS docs](https://docs.nestjs.com/),
  [Nest WebSocket gateways](https://docs.nestjs.com/websockets/gateways).
- **Cross-cutting** — [Vitest](https://vitest.dev/guide/),
  [GitHub Actions](https://docs.github.com/en/actions),
  [OpenTelemetry](https://opentelemetry.io/docs/) — the trophy/CI/observability wiring of task 3.

## Done when

- [ ] **Kanban slice** — `BoardService` does board CRUD over an injected repo; every mutation
      `requireSession`s first (an unauthenticated call is rejected before any write); an optimistic
      move shows immediately, reconciles to the server board, and rolls back on failure.
- [ ] **Chat slice** — `verifyChatToken` (jose) gates every socket action against an injected
      clock; posting broadcasts to the room's members ONLY; `history` is time-ordered; an
      unauthenticated (bad/expired token) action is rejected.
- [ ] **Cross-cutting** — `withObservability` emits exactly one linked trace span + one structured
      log per action; `buildDeployPlan` uses the two DIFFERENT auth stacks and orders migrate
      before release; `buildTestPlan` describes both slices as a trophy.
- [ ] **Ship & document** — `checkAppsReady` reports a fully-wired input as ready/done and a slice
      missing its auth stack (or an action, or its tests) as NOT ready, naming the gap. Both apps
      documented below; `/progress` reports both slices complete.

> **Extend (EXT):** tasks 1–3 ship a full worked reference in `solution/`, mirrored into `src/` so
> you can read, run, and extend it. Task 4 (**TODO**) throws in `src/`; implement `checkAppsReady`
> there, then flip the test import from `../solution/04-readiness.js` to `../src/04-readiness.js`.

---

## The two capstone apps

### Kanban board (Trello-lite) — `apps/kanban-web` + `apps/kanban-api`

- **Stack:** Next.js RSC + Server Actions, Prisma over Postgres, GraphQL (code-first Nest), Auth.js
  (session/OAuth), TanStack Query, Tailwind + `@learn-fullstack/ui`.
- **Slice built here:** `BoardService` (createBoard / addCard / moveCard) over an injected,
  Prisma-shaped `BoardRepo`; the optimistic drag-move reducer + runner; the Auth.js-style
  `requireSession` guard. The real app binds the repo to `@learn-fullstack/db`, wraps the mutations
  as `"use server"` actions, and reads the session from `auth()`.
- **Auth:** cookie **session** — the server owns identity; a mutation calls `requireSession(session)`
  and threads the trusted `ownerId` through.

### Realtime chat (Slack-lite) — `apps/chat-web` + `apps/chat-api`

- **Stack:** Vite SPA + Nest REST/WS gateway, raw SQL (`pg`), JWT/Passport, Redux Toolkit, CSS
  Modules, `useSocket()` from `@learn-fullstack/api-client`.
- **Slice built here:** `ChatService` (joinRoom / postMessage / history) over an injected,
  raw-SQL-shaped `MessageRepo`; the `ChatGateway` broadcast fan-out (room-members-only) over a
  faked in-process transport; JWT auth (`jose`) on every action; the `useSocket`-style connection
  store. The real app binds the gateway to a Nest `@WebSocketGateway` and `socket.io`.
- **Auth:** stateless **JWT** — a short-lived HS256 token carries identity; the gateway
  `verifyChatToken`s it against the clock before join/post.

### How `/progress` reports them

`/progress` runs `pnpm typecheck` + `pnpm test` for this module and greps `src/` for unfinished
`throw new Error("TODO")` stubs (task 4 starts as one). Feed the per-slice status into
`checkAppsReady({ kanban, chat })`: it returns `{ slices, done, missing }`, where each slice reports
`ready` plus a NAMED `missing[]` (`"kanban: missing auth stack"`, `'chat: missing action "postMessage"'`,
`"kanban: no tests referenced"`). The module is complete when `checkAppsReady` reports `done: true`
with an empty `missing[]` and both slices' test files pass — that is the readiness signal `/progress`
prints for the capstone.
