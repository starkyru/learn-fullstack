# Module 15 — SQL & Postgres (raw) 🟡🔴

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Write real SQL against a **real Postgres** — no ORM. Every function takes a connected
[`node-postgres`](https://node-postgres.com) `Client`, so the tests inject one backed by an
ephemeral container (the course helper `withEphemeralPostgres` from `@learn-fullstack/testing`,
or `new PostgreSqlContainer("postgres:16-alpine")` directly). You do the DDL, the joins, the
transaction, the index — and you watch the query planner change its mind in `EXPLAIN`.

## Concepts

- **DDL is code** — `CREATE TABLE`, primary keys, `REFERENCES` foreign keys, and column defaults
  define the shape your queries rely on. Seeding is just parameterized `INSERT`s.
- **Joins & aggregation** — a board view is a 3-table `JOIN` (`boards ⋈ lists ⋈ cards`); a
  per-list `card_count` is what an aggregate would compute, kept denormalized so a transaction
  must maintain it.
- **Keyset > offset pagination** — `WHERE id > $after ORDER BY id LIMIT $n` walks a B-tree with no
  `OFFSET` scan, so page N costs the same as page 1.
- **B-tree indexes** — without one, a filtered `SELECT` is a **Seq Scan** over every row; add
  `CREATE INDEX … (list_id)` and the planner switches to an **Index Scan**. `EXPLAIN (ANALYZE)`
  shows you which, and how expensive.
- **Transactions & isolation** — `BEGIN … COMMIT` makes several writes atomic; on any error you
  `ROLLBACK` and the table is byte-for-byte unchanged. `SELECT … FOR UPDATE` locks the row you're
  about to move.
- **N+1** — one query for the lists then one query _per list_ for its cards is `1 + N` round-trips;
  a single `WHERE list_id = ANY($ids)` returns identical data in **2**.
- **Pooling & parameterized queries** — values always travel as bound params (`$1`, `$2`), never
  string-interpolated. That is both the pooling-friendly and the **SQL-injection-proof** path; a
  `'); DROP TABLE …` payload lands as literal data, not executable SQL.

## Tasks

| #   | Task               | Lane | Type | What you build                                                                |
| --- | ------------------ | ---- | ---- | ----------------------------------------------------------------------------- |
| 1   | Schema + seed      | 🟢   | WE   | solved users DDL+query + analog boards/cards schema stub                      |
| 2   | Joins & pagination | 🟡   | TODO | keyset pagination + a 3-table join for the board view                         |
| 3   | Transactions       | 🟡   | TODO | move-card as an atomic transaction; prove rollback                            |
| 4   | Index & N+1 hunt   | 🔴   | FS   | reproduce an N+1 + a seq-scan; fix with a batched query + index; read EXPLAIN |
| 5   | Mini query builder | 🔴   | FS   | typed `from(t).where().limit()` to parameterized SQL — no Prisma/Drizzle/Knex |

## Done when

- [ ] `getUser` / `seedUsers` use bound params, so a SQL-injection payload is stored as literal
      data and the table survives — the parameterized query blocks the injection attempt.
- [ ] `keysetPageCards` walks pages by id and `boardView` returns the flattened 3-table join in
      `list.position, card.position` order.
- [ ] `moveCard` moves the card and rebalances both lists' `card_count` in one transaction; a move
      to a missing list rejects and leaves every row unchanged — the transaction rolls back cleanly.
- [ ] The batched loader returns byte-identical data to the N+1 loader in far fewer queries, and
      `EXPLAIN` shows a **Seq Scan** before the index and an **Index Scan** after it.
- [ ] `from(t).select().where().limit().toSQL()` emits `{ text, values }` with every value as a
      `$n` placeholder — never interpolated.

> **Worked example (WE):** the `users` schema, `seedUsers`, and `getUser` are fully solved in
> **both** `src/` and `solution/`; the analog `createBoardsSchema` / `createCards` throw `TODO` in
> `src/` — implement them by mirroring the users DDL. **TODO** tasks (2, 3) throw in `src/`; keep
> the signature and return shape, implement the body. **FS** tasks (4, 5) throw from an empty
> `src/` — build them from scratch. Tests import from `solution/`; point them at `../src/…` to
> grade your own build.
