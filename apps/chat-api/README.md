# chat-api — Pulse (realtime chat) backend

`@learn-fullstack/chat-api` is the **NestJS** backend for the **Pulse** chat capstone
(the Slack-lite app). This package is an **M0+ vertical slice**, not the finished
service: one authenticated message feature over REST **and** WebSockets, wired with Nest
DI, with a passing test suite and clean typecheck.

## Stack

- **NestJS 10** — modules, controllers, providers, DI.
- **REST** — `ChatController` over an in-memory `MessageService`.
- **WebSockets** — `ChatGateway` on **socket.io** (`@nestjs/platform-socket.io`): join a
  room, broadcast a message to that room.
- **Auth: JWT / Passport-style** — `JwtAuthGuard` verifies an `Authorization: Bearer`
  token with **jose** (HS256) against an **injected** secret + clock, hydrating
  `req.user`. Missing/invalid/expired → **401**. (Contrast the Kanban capstone, which
  uses Auth.js **sessions** — see `docs/AUTH_COMPARISON.html`.)
- **Persistence (target): Prisma-writes / raw-read** — the real app writes messages
  through Prisma and reads recent history back with a hand-written raw SQL query. The
  slice uses an in-memory `Map` so it runs with no database.

## Layout

```text
src/
  main.ts             # NestFactory bootstrap + socket.io adapter (NOT gated)
  chat.module.ts      # DI wiring; provides the real secret (env) + system clock
  chat.controller.ts  # REST: GET/POST /rooms/:id/messages, guarded
  chat.gateway.ts     # socket.io: `join` a room, broadcast `message`
  jwt-auth.guard.ts   # jose bearer-token verification as a Nest CanActivate
  message.service.ts  # in-memory store, injected (deterministic) id source
  tokens.ts           # issueAccessToken + Clock/DI tokens (shared with tests)
test/
  chat.controller.test.ts  # supertest: 401 without token, 201/200 with a valid one
  chat.gateway.test.ts     # two socket.io clients, ephemeral port, room broadcast
```

## REST surface (all routes require a valid bearer token)

| Method | Path                  | Body       | Response                                         |
| ------ | --------------------- | ---------- | ------------------------------------------------ |
| `GET`  | `/rooms/:id/messages` | —          | `200` `Message[]` (that room's history)          |
| `POST` | `/rooms/:id/messages` | `{ text }` | `201` `Message` (`from` = server-verified `sub`) |

`Message = { id, room, from, text }`. `from` is always taken from the verified token,
never trusted from the request body.

## Run it

```bash
# dev server (REST on :3001, socket.io on the same port)
JWT_SECRET=some-long-dev-secret pnpm --filter @learn-fullstack/chat-api dev

# gate — the only two commands that must pass
pnpm --filter @learn-fullstack/chat-api exec tsc --noEmit
pnpm --filter @learn-fullstack/chat-api exec vitest run
```

Tests are node-environment and use the module-18 Nest + SWC toolchain (`unplugin-swc`
emits the decorator metadata Nest's DI needs; `test/setup.ts` polyfills
`reflect-metadata`). The gateway test opens the app on an ephemeral port
(`app.listen(0)`) and closes both clients + the app in `afterAll` for a clean exit.

## Milestones (TODO)

- **M1** — swap the in-memory store for **Prisma writes** + a raw SQL recent-history read;
  `Room` / `Message` / `User` schema in `@learn-fullstack/db`.
- **M2** — real auth routes: `POST /auth/login` (bcrypt verify via
  `@learn-fullstack/auth`) issuing the access token; refresh-token rotation with reuse
  detection.
- **M3** — socket **handshake auth**: a WS `JwtAuthGuard` that verifies
  `handshake.auth.token` on connect and stamps `from` from the verified `sub` (drop trust
  in the client payload); typing indicators + presence (see module 22's `PresenceGateway`).
- **M4** — DTO validation (`class-validator` / zod pipe), pagination, per-room membership
  authorization.
- **M5** — `@learn-fullstack/api-client` typed REST + `useSocket()` consumed by the
  `chat-web` Vite SPA (Redux Toolkit).
- **M6** — ops: config validation (fail fast if `JWT_SECRET` unset in prod), rate limiting,
  Docker image, CI gate, observability.
