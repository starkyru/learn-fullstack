# Capstone apps — full specs (Trellix & Pulse)

The two capstones under `apps/` exercise **everything** between them, with deliberately
**non-overlapping** stacks so the learner practices _both_ of every "pick one of two"
decision. This file is the **target design** (data models, API surface, milestones); each
app's own README tracks what's actually built so far:

- 🅰 Kanban "Trellix" — [`apps/kanban-web`](../apps/kanban-web/README.md) (Next.js) +
  [`apps/kanban-api`](../apps/kanban-api/README.md) (Nest GraphQL)
- 🅱 Chat "Pulse" — [`apps/chat-web`](../apps/chat-web/README.md) (Vite SPA) +
  [`apps/chat-api`](../apps/chat-api/README.md) (Nest REST/WS)

Both consume the same `packages/ui` (Storybook-documented) — one design system feeding two
very different products. Module **29** (see [`CURRICULUM.md`](../CURRICULUM.md)) integrates
them.

## The deliberate split

| Axis                | 🅰 Kanban — "Trellix" (`kanban-web` + `-api`)                | 🅱 Chat — "Pulse" (`chat-web` + `-api`)                                                                        |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | Next.js App Router (RSC, Server Actions, streaming, ISR)    | Vite React SPA (client-rendered)                                                                              |
| **API style**       | **GraphQL** end-to-end (Nest code-first ↔ typed client)     | **REST** (OpenAPI/Swagger) + **WebSockets**                                                                   |
| **Realtime**        | GraphQL **subscriptions** + **SSE** activity feed           | **WebSockets** (socket.io gateway + `useSocket`)                                                              |
| **Server-state**    | **TanStack Query** (SSR hydration, optimistic, infinite)    | **RTK Query** + a socket middleware into the store                                                            |
| **Client/UI state** | **Zustand** (drag, modals, filters, ⌘K)                     | **Redux Toolkit** slices (auth, channel, composer, presence)                                                  |
| **Auth**            | **Auth.js/NextAuth** — OAuth/OIDC + Credentials + RBAC      | **Passport + Guards** — JWT access+refresh rotation, argon2, socket-auth; magic-link + hand-rolled 🔴 stretch |
| **DB access**       | **Prisma-first** (relations, nested writes, `$transaction`) | **Prisma** for writes, **raw `postgres.js`** for the hot read path (keyset + FTS)                             |
| **Styling**         | **Tailwind** (app-level) + `packages/ui`                    | **CSS Modules / vanilla CSS** (app-level) + `packages/ui`                                                     |
| **Testing**         | Playwright drag-drop, MSW-for-GraphQL, Storybook play       | Nest e2e + Testcontainers, WS gateway integration, contract, MSW-for-REST                                     |

## 🅰 Kanban — "Trellix" (Next.js + GraphQL showcase)

A Trello-lite collaborative board: workspaces → boards → columns → cards, with
drag-to-reorder, labels, assignees, due dates, comments, an activity feed, and **live
multi-user collaboration**.

**Data model (Prisma sketch):**

```prisma
model User   { id String @id @default(cuid()) email String @unique name String?
               accounts Account[] sessions Session[] memberships BoardMembership[]
               assigned CardAssignee[] comments Comment[] }        // NextAuth adapter
model Board  { id String @id @default(cuid()) name String slug String @unique
               visibility Visibility @default(PRIVATE) ownerId String
               columns Column[] labels Label[] members BoardMembership[] activities Activity[] }
model BoardMembership { id String @id @default(cuid()) boardId String userId String
               role Role @default(MEMBER) @@unique([boardId, userId]) }   // RBAC
model Column { id String @id @default(cuid()) boardId String name String
               rank String cards Card[] @@index([boardId, rank]) }        // 🔴 fractional index
model Card   { id String @id @default(cuid()) columnId String title String description String?
               rank String dueDate DateTime? archived Boolean @default(false)
               labels CardLabel[] assignees CardAssignee[] comments Comment[]
               @@index([columnId, rank]) }
model Comment{ id String @id @default(cuid()) cardId String authorId String body String
               createdAt DateTime @default(now()) }
model Activity{ id String @id @default(cuid()) boardId String actorId String type String
               payload Json createdAt DateTime @default(now()) @@index([boardId, createdAt]) }
enum Visibility { PRIVATE PUBLIC }   enum Role { OWNER MEMBER VIEWER }
// + Label, CardLabel, CardAssignee join tables; + NextAuth Account/Session/VerificationToken
```

**API surface (GraphQL, code-first Nest):** `Query { me, board(slug), boards,
searchCards, archivedCards(after,first): CardConnection }` · `Mutation { createBoard,
addMember, createColumn, moveColumn, createCard, updateCard, moveCard(cardId,
toColumnId, beforeId, afterId), addComment, assignMember }` · `Subscription {
boardUpdated(boardId): BoardEvent, presence(boardId) }`. DataLoader batches
`card.labels`/`assignees`/`comments`; a `@BoardRole` guard reads the GraphQL context;
`moveCard` computes ranks server-side inside a `$transaction`.

**Milestones:**

| M                        | Done when                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 Scaffold**          | `turbo dev` boots `kanban-web` (Next) + `kanban-api` (Nest GraphQL) + Postgres; `/graphql` playground loads; Storybook runs.                                                      |
| **M1 Auth & shell**      | Sign in with GitHub **and** Credentials; middleware gates `/app`; RBAC seeded; `me` returns the session user.                                                                     |
| **M2 Boards CRUD**       | Dashboard (RSC/SSR) lists boards; create/rename/delete via **Server Actions** + `useOptimistic` + zod; board streams columns with `<Suspense>`; TanStack Query hydrated from RSC. |
| **M3 Cards & drag-drop** | Drag reorder within/across columns is **optimistic** and survives reload (ranks persisted); DataLoader kills the labels/assignees N+1; archive uses an infinite query.            |
| **M4 Realtime collab**   | Two browsers on one board: a move/comment in A appears in B < ~200ms over a subscription; presence avatars; SSE activity feed streams.                                            |
| **M5 Polish & a11y**     | Public board ISR page + `generateMetadata` + OG image; ⌘K palette; keyboard drag + focus traps; Storybook **play tests** green; Lighthouse a11y ≥ 95.                             |
| **M6 Test & ship**       | Playwright drag-drop E2E + Vitest + MSW-GraphQL green in CI; Web on **Vercel**, API on **Railway/Fly**, migrations on deploy.                                                     |

**Stretch (🔴):** LexoRank/fractional indexing from scratch (no lib); a hand-rolled
mini query client for the board; swap `graphql-request` → Apollo (normalized cache) and
write the tradeoff note.

## 🅱 Chat — "Pulse" (NestJS REST + WebSockets + Redux showcase)

A Slack-lite: channels (public/private + DMs) with realtime messages, typing
indicators, presence, reactions, threads, unread counts, edit/delete, full-text search.
**Reuses the module-22 `useSocket` hook** end-to-end.

**Data model (Prisma sketch — reads go raw):**

```prisma
model User    { id String @id @default(cuid()) email String @unique passwordHash String  // argon2
                displayName String avatarUrl String? status Presence @default(OFFLINE)
                lastSeenAt DateTime @default(now()) refreshTokens RefreshToken[]
                memberships ChannelMember[] messages Message[] }
model RefreshToken { id String @id @default(cuid()) userId String tokenHash String
                family String expiresAt DateTime revokedAt DateTime? @@index([userId]) }  // rotation family; reuse ⇒ revoke
model Channel { id String @id @default(cuid()) name String slug String @unique topic String?
                isPrivate Boolean @default(false) isDm Boolean @default(false)
                members ChannelMember[] messages Message[] }
model ChannelMember { id String @id @default(cuid()) channelId String userId String
                role ChannelRole @default(MEMBER) lastReadAt DateTime @default(now())
                @@unique([channelId, userId]) }                          // unread counts
model Message { id String @id @default(cuid()) channelId String senderId String body String
                parentId String? editedAt DateTime? deletedAt DateTime? createdAt DateTime @default(now())
                reactions Reaction[] @@index([channelId, createdAt]) }    // + tsvector GIN for FTS
model Reaction{ id String @id @default(cuid()) messageId String userId String emoji String
                @@unique([messageId, userId, emoji]) }
enum Presence { ONLINE AWAY OFFLINE }   enum ChannelRole { ADMIN MEMBER }
```

> Schema/writes via **Prisma**; the hot read path (`GET /channels/:id/messages`) is
> **raw `postgres.js`** — a keyset query (`WHERE (created_at, id) < ($cursor) ORDER BY …
LIMIT n`) against `@@index([channelId, createdAt])` + a `to_tsvector` GIN index for
> search. Where the index/pooling/N+1 lessons pay off.

**API surface (REST + WS):** REST (`/v1`, Swagger at `/docs`) — `POST /auth/{register,
login,refresh,logout}`, `GET /auth/me`, `POST /auth/magic-link` (stretch); `GET/POST
/channels`, `.../:id/members`, `GET /channels/:id/messages?cursor=&limit=` (raw), `POST/
PATCH/DELETE /messages/...`, `POST /messages/:id/reactions`, `GET /search/messages?q=`.
**WS gateway** (`/chat`, authenticated on handshake): client→server `channel:join/leave`,
`message:send/edit`, `typing:start/stop`, `reaction:add`; server→client `message:new/
updated/deleted`, `typing`, `presence`, `reaction`, `unread`. One socket.io room per
channel; a `WsAuthGuard` validates the JWT on connect; a Redux **socket middleware**
turns inbound events into store actions.

**Milestones:**

| M                               | Done when                                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 Scaffold**                 | `turbo dev` boots `chat-web` (Vite) + `chat-api` (Nest) + Postgres; Swagger `/docs` renders; Storybook runs.                                                                     |
| **M1 Auth**                     | Register/login issues JWT + rotating refresh in httpOnly cookies; argon2 verified; refresh-reuse revokes the family; `GET /auth/me` gated by a Guard; RTK Query `authApi` wired. |
| **M2 Channels & messages**      | Create/join channels; post/edit/delete; history via **keyset pagination** (raw `postgres.js`) newest-first; unread counts correct.                                               |
| **M3 Realtime**                 | WS authenticated on handshake; two clients see each other's `message:new`/`typing`/`presence` live; `useSocket` reconnects with backoff and re-joins rooms.                      |
| **M4 Reactions/threads/search** | Emoji reactions broadcast live; threads render; `GET /search/messages` returns FTS hits highlighted; optimistic send reconciles on ack.                                          |
| **M5 Polish & resilience**      | Virtualized list 60fps at 5k messages; offline queue flushes on reconnect; Storybook play tests for composer/list green.                                                         |
| **M6 Test & ship**              | Nest **e2e vs ephemeral Postgres** (Testcontainers) + WS integration + Vitest + MSW-REST green in CI; Web static, API on Railway/Fly, migrations on deploy.                      |

**Stretch (🔴):** `useSocket` from scratch (raw `WebSocket` + heartbeat + backoff+jitter +
offline queue, no socket.io-client); hand-rolled Lucia-style session auth replacing
Passport-JWT (compare security tradeoffs); magic-link/passwordless as a second auth method.

## Coverage note

Between the two apps: **all React hooks** (`useSyncExternalStore` is the star of both —
Zustand impl _and_ `useSocket`); **full Next.js surface** (Kanban); **RTK+RTK Query+
middleware** (Chat) vs **Zustand + TanStack Query** (Kanban); **the whole Nest pipeline**
exercised via REST (Chat) _and_ GraphQL (Kanban); **REST** (Chat) vs **GraphQL both
ends** (Kanban); **Prisma** (both) + **raw `postgres.js`** (Chat); **auth compared**
(Auth.js/OAuth/RBAC vs Passport/JWT-rotation/socket-auth + 🔴 hand-rolled); **realtime
compared** (WS vs subscriptions vs SSE); **Storybook `packages/ui`** consumed by both;
**styling split** (Tailwind vs CSS Modules); **the full testing trophy**.
