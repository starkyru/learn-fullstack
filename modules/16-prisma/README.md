# Module 16 — Prisma 🟡 balanced

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Type-safe data access with Prisma. You model a Trello-ish domain (`User` → `Board` → `List` →
`Card`), migrate it, then write the nested reads/writes, an interactive transaction, a shared seed,
and an N+1 fix — every function taking a `PrismaClient` so tests inject one bound to a throwaway
SQLite database. The engine is SQLite (fast + deterministic, no Docker), but Prisma abstracts the
engine: the schema, relations, transactions and query-planning lessons are identical on Postgres.

## Concepts

- **The schema is the source of truth** — models + relations in `prisma/schema.prisma` compile to a
  fully-typed client. A relation is one `@relation(fields, references)` on the child plus a back-list
  on the parent; `prisma migrate dev` (or `prisma db push` for a throwaway DB) turns the schema into
  tables. This module generates its client into a **local** `src/generated/client`, so you
  `import { PrismaClient } from "../src/generated/client/index.js"` — not from `@prisma/client`.
- **Nested reads and writes are one round-trip each** — `board.create({ data: { lists: { create:
[{ cards: { create: [...] } }] } } })` inserts a whole board→lists→cards tree, and `findUnique({
include: { lists: { include: { cards: true } } } })` reads it back **fully typed**: the return type
  is `Prisma.BoardGetPayload<{ include: … }>`, so `board.lists[0].cards[0].title` is checked, not
  `any`.
- **`$transaction(async (tx) => …)` is atomic** — the interactive form gives you a `tx` client; if
  the callback throws, every write in it rolls back. That is how `moveCard` either fully moves a card
  or leaves the row untouched.
- **`include`/`select` kills N+1** — looping `card.findMany` per list issues `1 + N` queries; a single
  `list.findMany({ include: { cards: true } })` returns identical data in a constant handful of
  queries. A compound `@@index([listId, position])` keeps that hot path off a table scan.

## Prisma commands

```bash
# One-off, for a throwaway DB (what the test harness runs): push the schema, no migration history.
DATABASE_URL="file:./dev.db" pnpm exec prisma db push --schema prisma/schema.prisma

# The real workflow: create + apply a named migration, recording it under prisma/migrations/.
DATABASE_URL="file:./dev.db" pnpm exec prisma migrate dev --name init --schema prisma/schema.prisma

# Regenerate the local typed client after any schema change (also runs automatically as `pretest`).
pnpm exec prisma generate --schema prisma/schema.prisma
```

## Tasks

| #   | Task                | Lane | Type | What you build                                                  |
| --- | ------------------- | ---- | ---- | --------------------------------------------------------------- |
| 1   | Schema & migrate    | 🟢   | WE   | solved User model + analog Board/List/Card stub; migrate dev    |
| 2   | Relations & queries | 🟡   | TODO | nested reads/writes for a board with lists+cards; typed results |
| 3   | Transactions & seed | 🟡   | TODO | interactive transaction + a seed script both apps share         |
| 4   | Perf                | 🟢   | EXT  | fix a Prisma N+1 with include/select; add a compound index      |

## Theory & docs

- **Schema & migrate** — [Models](https://www.prisma.io/docs/orm/prisma-schema/data-model/models) ·
  [Getting started with Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) ·
  [Prototyping with `db push`](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema)
- **Relations & queries** — [Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) ·
  [Relation queries (nested reads/writes)](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries) ·
  [Type safety (`GetPayload`)](https://www.prisma.io/docs/orm/prisma-client/type-safety)
- **Transactions & seed** — [Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) ·
  [Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)
- **Perf** — [Query optimization (N+1)](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) ·
  [Indexes](https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes) ·
  [Logging (`$on("query")`)](https://www.prisma.io/docs/orm/prisma-client/debugging-and-troubleshooting/logging)
- Background — [SQLite connector](https://www.prisma.io/docs/orm/overview/databases/sqlite) ·
  [Generating the client (custom `output`)](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client)

## Done when

- [ ] `prisma db push` / `migrate dev` produces the schema and the generated client typechecks.
- [ ] `getUser`/`createUser` are the solved reference; the analog `createBoard`/`createList`/
      `createCard`/`getBoard` mirror them (task 1).
- [ ] `createBoardWithListsAndCards` inserts the whole tree and `getBoardView` reads it back as a
      fully-typed `board → lists → cards` (task 2).
- [ ] `moveCard` moves a card inside one interactive `$transaction` and **rolls back** on error;
      `seed(prisma)` populates deterministic data both apps can share (task 3).
- [ ] The `include`/`select` query returns data identical to the naive loop while issuing **fewer**
      queries, counted via Prisma's `$on("query")` event (task 4).

> **Worked example (WE):** task 1's `User` functions are solved in both `src/` and `solution/`; the
> Board/List/Card analog throws in `src/` — implement it by mirroring `User`.
> **TODO / EXT:** `src/` stubs throw `TODO` (implement them); the EXT file ships complete (read, then
> extend). Tests import from `solution/`; flip an import to `../src/…` to grade your own build.
