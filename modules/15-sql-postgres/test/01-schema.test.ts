import { Client } from "pg";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createBoardsSchema,
  createCards,
  createUsersSchema,
  getUser,
  seedUsers,
} from "../solution/01-schema.js";

let container: StartedPostgreSqlContainer;
let client: Client;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
});

afterAll(async () => {
  await client.end();
  await container.stop();
});

beforeEach(async () => {
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
});

describe("users schema (worked example)", () => {
  it("createUsersSchema + seedUsers + getUser round-trips an exact row", async () => {
    await createUsersSchema(client);
    await seedUsers(client, [
      { id: 1, email: "ada@calc.dev", name: "Ada" },
      { id: 2, email: "grace@nav.mil", name: "Grace" },
    ]);

    expect(await getUser(client, 2)).toEqual({
      id: 2,
      email: "grace@nav.mil",
      name: "Grace",
    });
  });

  it("getUser returns undefined for an unknown id (noUncheckedIndexedAccess)", async () => {
    await createUsersSchema(client);
    expect(await getUser(client, 999)).toBeUndefined();
  });

  it("parameterized seed stores a SQL-injection payload as literal data — the table survives", async () => {
    await createUsersSchema(client);
    const payload = "Robert'); DROP TABLE users; --";

    await seedUsers(client, [{ id: 1, email: "bobby@tables.dev", name: payload }]);

    // The payload is data, not SQL: it comes back verbatim…
    expect(await getUser(client, 1)).toEqual({
      id: 1,
      email: "bobby@tables.dev",
      name: payload,
    });
    // …and the table was never dropped — a second insert still works.
    await seedUsers(client, [{ id: 2, email: "ann@x.dev", name: "Ann" }]);
    expect(await getUser(client, 2)).toEqual({ id: 2, email: "ann@x.dev", name: "Ann" });
  });
});

describe("boards/cards schema (analog)", () => {
  it("createBoardsSchema + createCards produce FK-linked tables that accept a full row", async () => {
    await createBoardsSchema(client);
    await createCards(client);

    await client.query("INSERT INTO boards (id, title) VALUES (1, 'Sprint')");
    await client.query(
      "INSERT INTO lists (id, board_id, title, position) VALUES (1, 1, 'Todo', 1)",
    );
    await client.query(
      "INSERT INTO cards (id, list_id, title, position) VALUES (1, 1, 'Write SQL', 1)",
    );

    const board = await client.query<{ card_count: number }>(
      "SELECT card_count FROM lists WHERE id = 1",
    );
    expect(board.rows[0]).toEqual({ card_count: 0 }); // DEFAULT 0 applied

    const card = await client.query<{
      id: number;
      list_id: number;
      title: string;
      position: number;
    }>("SELECT id, list_id, title, position FROM cards WHERE id = 1");
    expect(card.rows[0]).toEqual({ id: 1, list_id: 1, title: "Write SQL", position: 1 });
  });

  it("the lists.board_id foreign key rejects an orphan list", async () => {
    await createBoardsSchema(client);
    await createCards(client);

    await expect(
      client.query(
        "INSERT INTO lists (id, board_id, title, position) VALUES (1, 42, 'Orphan', 1)",
      ),
    ).rejects.toThrow();
  });
});
