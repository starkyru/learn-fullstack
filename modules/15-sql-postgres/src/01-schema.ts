/**
 * Task 1 — Schema + seed (WORKED EXAMPLE).
 *
 * The `users` trio (`createUsersSchema` / `seedUsers` / `getUser`) below is the fully-solved
 * reference: DDL, a *parameterized* seed insert, and a single-row lookup. Read it, then do YOUR
 * TURN — implement `createBoardsSchema` / `createCards` (the throwing stubs) so the board/list/card
 * tables the later tasks query exist, mirroring the users DDL.
 *
 * Every function takes a connected `pg.Client` so tests can inject one backed by an ephemeral
 * Postgres. Values ALWAYS travel as bound params (`$1`, `$2`, …), never string-interpolated — that
 * is what makes the seed injection-proof. Under `noUncheckedIndexedAccess`, `rows[0]` is
 * `Row | undefined`, so `getUser` returns exactly that.
 */
import type { Client } from "pg";

export type UserSeed = { id: number; email: string; name: string };
export type UserRow = { id: number; email: string; name: string };

/** DDL for the reference `users` table. Explicit integer PK → deterministic ids in tests. */
export async function createUsersSchema(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE users (
      id    integer PRIMARY KEY,
      email text NOT NULL UNIQUE,
      name  text NOT NULL
    );
  `);
}

/** Parameterized seed — each column is a bound param, so payloads stay literal data. */
export async function seedUsers(
  client: Client,
  users: readonly UserSeed[],
): Promise<void> {
  for (const user of users) {
    await client.query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)", [
      user.id,
      user.email,
      user.name,
    ]);
  }
}

/** Single-row lookup by id. `rows[0]` is possibly-undefined — return it as-is. */
export async function getUser(client: Client, id: number): Promise<UserRow | undefined> {
  const res = await client.query<UserRow>(
    "SELECT id, email, name FROM users WHERE id = $1",
    [id],
  );
  return res.rows[0];
}

/**
 * YOUR TURN (analog) — DDL for `boards` + `lists`, mirroring the users DDL above:
 *   1. `boards`: `id integer PRIMARY KEY`, `title text NOT NULL`.
 *   2. `lists`: `id integer PRIMARY KEY`, `board_id integer NOT NULL REFERENCES boards(id)`,
 *      `title text NOT NULL`, `position integer NOT NULL`, `card_count integer NOT NULL DEFAULT 0`.
 */
export async function createBoardsSchema(_client: Client): Promise<void> {
  throw new Error("TODO: create the boards + lists tables (mirror createUsersSchema)");
}

/**
 * YOUR TURN (analog) — DDL for `cards`:
 *   `id integer PRIMARY KEY`, `list_id integer NOT NULL REFERENCES lists(id)`,
 *   `title text NOT NULL`, `position integer NOT NULL`.
 */
export async function createCards(_client: Client): Promise<void> {
  throw new Error("TODO: create the cards table (foreign key into lists)");
}
