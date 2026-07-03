import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";

/**
 * Drives the REAL slice over HTTP: boot the whole `AppModule` (in-memory Apollo schema + BoardsModule),
 * POST GraphQL operations to `/graphql`, and assert the exact data. Expected values are hand-written
 * from the deterministic seed in `BoardsService` — never computed by the code under test.
 *
 * One shared app (closed in `afterAll` so no HTTP handle leaks). The read tests run first and observe
 * the pristine seed; the two mutation tests run after and each assert only their own delta, so the
 * single injected `SeqIdSource` yields `card-1` for the lone `createCard`.
 */
describe("kanban-api — BoardsResolver over GraphQL", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = ref.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const gql = (query: string) =>
    request(app.getHttpServer()).post("/graphql").send({ query });

  it("boards query returns every board (top-level fields)", async () => {
    const res = await gql(`{ boards { id slug name } }`);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.boards).toEqual([
      { id: "board-1", slug: "trellix", name: "Trellix Roadmap" },
    ]);
  });

  it("board(slug) resolves the full nested board with the shared User owner", async () => {
    const res = await gql(`
      {
        board(slug: "trellix") {
          id
          slug
          name
          owner { id email name }
          columns {
            id
            title
            cards { id columnId title }
          }
        }
      }
    `);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.board).toEqual({
      id: "board-1",
      slug: "trellix",
      name: "Trellix Roadmap",
      owner: { id: "user-ada", email: "ada@trellix.dev", name: "Ada Lovelace" },
      columns: [
        {
          id: "col-todo",
          title: "To Do",
          cards: [
            {
              id: "card-design",
              columnId: "col-todo",
              title: "Design the GraphQL schema",
            },
          ],
        },
        {
          id: "col-doing",
          title: "In Progress",
          cards: [
            { id: "card-wire", columnId: "col-doing", title: "Wire the BoardsResolver" },
          ],
        },
        { id: "col-done", title: "Done", cards: [] },
      ],
    });
  });

  it("board(slug) returns null for an unknown slug", async () => {
    const res = await gql(`{ board(slug: "nope") { id } }`);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.board).toBeNull();
  });

  it("createCard appends a card (deterministic injected id) and the board query reflects it", async () => {
    const mutation = await gql(`
      mutation {
        createCard(columnId: "col-done", title: "Write the README") { id columnId title }
      }
    `);
    expect(mutation.body.errors).toBeUndefined();
    expect(mutation.body.data.createCard).toEqual({
      id: "card-1",
      columnId: "col-done",
      title: "Write the README",
    });

    const read = await gql(`
      { board(slug: "trellix") { columns { id cards { id columnId title } } } }
    `);
    const done = read.body.data.board.columns.find(
      (c: { id: string }) => c.id === "col-done",
    );
    expect(done.cards).toEqual([
      { id: "card-1", columnId: "col-done", title: "Write the README" },
    ]);
  });

  it("moveCard moves a card between columns, updating its columnId", async () => {
    const mutation = await gql(`
      mutation {
        moveCard(cardId: "card-design", toColumnId: "col-doing") { id columnId title }
      }
    `);
    expect(mutation.body.errors).toBeUndefined();
    expect(mutation.body.data.moveCard).toEqual({
      id: "card-design",
      columnId: "col-doing",
      title: "Design the GraphQL schema",
    });

    const read = await gql(`
      { board(slug: "trellix") { columns { id cards { id columnId title } } } }
    `);
    const columns: Array<{ id: string; cards: Array<{ id: string }> }> =
      read.body.data.board.columns;
    const todo = columns.find((c) => c.id === "col-todo");
    const doing = columns.find((c) => c.id === "col-doing");
    expect(todo?.cards).toEqual([]);
    expect(doing?.cards).toEqual([
      { id: "card-wire", columnId: "col-doing", title: "Wire the BoardsResolver" },
      { id: "card-design", columnId: "col-doing", title: "Design the GraphQL schema" },
    ]);
  });
});
