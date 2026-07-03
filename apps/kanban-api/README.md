# @learn-fullstack/kanban-api

The **NestJS code-first GraphQL API** for the Kanban capstone (Trellix — a Trello-lite board).
This is the **M0+ vertical slice**: one `BoardsModule` end-to-end, not the whole product.

## Stack

- **NestJS 10** — DI container + module system (`@nestjs/common`, `@nestjs/core`).
- **@nestjs/graphql + @nestjs/apollo (ApolloDriver)** — **code-first**: `@ObjectType`/`@Resolver`
  classes _are_ the schema. `autoSchemaFile: true` builds the SDL **in memory** (no `.graphql` file).
- **@apollo/server + @nestjs/platform-express** — the HTTP/GraphQL transport at `POST /graphql`.
- **@learn-fullstack/shared** — the `UserSchema` wire contract; the seed board `owner` is validated
  through it so client and server agree on one `User` shape.
- **Vitest + @nestjs/testing + supertest**, transformed by **SWC** (`unplugin-swc`) so the DI
  decorator metadata (`emitDecoratorMetadata`) survives into the test run; `reflect-metadata` is
  polyfilled first in `test/setup.ts`.

## The slice

`BoardsService` holds an in-memory board (`board-1` / slug `trellix`) with three columns
(`To Do`, `In Progress`, `Done`) and seeded cards. Card ids for new cards come from an **injected**
`SeqIdSource` (a seq counter) — no `Date.now()` / `Math.random()`, so tests are deterministic.

`BoardsResolver` exposes:

```graphql
type Query {
  board(slug: String!): Board
  boards: [Board!]!
}

type Mutation {
  createCard(columnId: ID!, title: String!): Card!
  moveCard(cardId: ID!, toColumnId: ID!): Card!
}
```

## Run

```bash
# dev server (GraphQL endpoint at http://localhost:3000/graphql) — needs `tsx` on PATH
pnpm --filter @learn-fullstack/kanban-api dev

# the gate
pnpm --filter @learn-fullstack/kanban-api exec tsc --noEmit
pnpm --filter @learn-fullstack/kanban-api exec vitest run
```

## Milestones (TODO)

- **M1** — persist boards/columns/cards via `@learn-fullstack/db` (Prisma) instead of the in-memory store.
- **M2** — `createColumn` / `renameColumn` / `deleteCard`, plus card `order`/position within a column.
- **M3** — auth: an Auth.js session guard (`GqlAuthGuard`) scoping boards to the signed-in owner + RBAC.
- **M4** — a `DataLoader` for `Board.owner` / `Column.cards` to kill the N+1 (see module 20b).
- **M5** — a `cardMoved` GraphQL subscription so `kanban-web` reflects moves in realtime.
- **M6** — input validation (`class-validator`), error mapping, rate limiting, and a persisted-schema file.
