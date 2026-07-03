import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createUser } from "../solution/01-schema.js";
import {
  createBoardWithListsAndCards,
  getBoardView,
  type BoardView,
} from "../solution/02-relations.js";

const moduleRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_FILE = path.join(moduleRoot, "prisma", ".tmp-test-02.db");
const DB_URL = `file:${DB_FILE}`;

let prisma: PrismaClient;

function removeDb(): void {
  for (const file of [DB_FILE, `${DB_FILE}-journal`]) {
    if (existsSync(file)) unlinkSync(file);
  }
}

beforeAll(() => {
  removeDb();
  execSync("prisma db push --skip-generate --schema prisma/schema.prisma", {
    cwd: moduleRoot,
    env: { ...process.env, DATABASE_URL: DB_URL },
    stdio: "ignore",
  });
  prisma = new PrismaClient({ datasourceUrl: DB_URL });
});

afterAll(async () => {
  await prisma.$disconnect();
  removeDb();
});

beforeEach(async () => {
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
});

// Strip DB-assigned ids down to the content + ordering the nested query must produce.
function content(board: BoardView) {
  return {
    title: board.title,
    ownerId: board.ownerId,
    lists: board.lists.map((list) => ({
      title: list.title,
      position: list.position,
      cards: list.cards.map((card) => ({ title: card.title, position: card.position })),
    })),
  };
}

describe("createBoardWithListsAndCards + getBoardView", () => {
  it("nested write inserts the tree; nested read returns it fully typed and position-ordered", async () => {
    const user = await createUser(prisma, { email: "ada@example.com", name: "Ada" });

    // Deliberately unordered input — the `include`'s `orderBy: position` must sort it.
    const created = await createBoardWithListsAndCards(prisma, {
      title: "Roadmap",
      ownerId: user.id,
      lists: [
        { title: "Doing", position: 1, cards: [{ title: "Build", position: 0 }] },
        {
          title: "To Do",
          position: 0,
          cards: [
            { title: "Design", position: 1 },
            { title: "Spec", position: 0 },
          ],
        },
      ],
    });

    expect(content(created)).toEqual({
      title: "Roadmap",
      ownerId: user.id,
      lists: [
        {
          title: "To Do",
          position: 0,
          cards: [
            { title: "Spec", position: 0 },
            { title: "Design", position: 1 },
          ],
        },
        { title: "Doing", position: 1, cards: [{ title: "Build", position: 0 }] },
      ],
    });

    // Fully-typed access is checked at compile time; assert the values too.
    expect(created.lists[0]?.cards[0]?.title).toBe("Spec");
    expect(created.id).toBeGreaterThan(0);

    // Reading it back returns the identical tree (same rows, same order).
    const view = await getBoardView(prisma, created.id);
    expect(view).toEqual(created);
  });

  it("getBoardView returns null for an unknown board id", async () => {
    expect(await getBoardView(prisma, 999)).toBeNull();
  });

  it("emits an explicit ORDER BY position for lists AND cards at the SQL boundary", async () => {
    // Why not just assert the returned row order? The schema's @@index([boardId, position]) and
    // @@index([listId, position]) let SQLite return rows in position order even with NO `ORDER BY`
    // (the WHERE ... IN filter is served straight off the compound index), so deleting the
    // solution's `orderBy` leaves the returned data unchanged and a data-order assertion stays
    // GREEN. Instead we measure at the TRUE external boundary — the SQL Prisma actually sends,
    // captured via `$on("query")` — and require the include read-back to carry an explicit
    // `ORDER BY ... position ASC` on both the List and the Card SELECT. This is what makes the
    // ordering deterministic in production (where the planner may pick a different plan), and it
    // fails the moment `orderBy: { position: "asc" }` is removed from the solution.
    const logged = new PrismaClient({
      datasourceUrl: DB_URL,
      log: [{ emit: "event", level: "query" }],
    });
    const sql: string[] = [];
    logged.$on("query", (event) => {
      sql.push(event.query);
    });

    // The include read-back SELECTs (present in BOTH createBoardWithListsAndCards and getBoardView).
    const listRead = (q: string) =>
      /FROM `main`\.`List`/.test(q) && /`main`\.`List`\.`boardId` IN/.test(q);
    const cardRead = (q: string) =>
      /FROM `main`\.`Card`/.test(q) && /`main`\.`Card`\.`listId` IN/.test(q);
    const listOrderBy = /ORDER BY `main`\.`List`\.`position` ASC/;
    const cardOrderBy = /ORDER BY `main`\.`Card`\.`position` ASC/;

    try {
      const user = await createUser(logged, {
        email: "grace@example.com",
        name: "Grace",
      });

      // createBoardWithListsAndCards reads the tree back through its own nested `include`.
      const created = await createBoardWithListsAndCards(logged, {
        title: "Roadmap",
        ownerId: user.id,
        lists: [
          { title: "Doing", position: 1, cards: [{ title: "Build", position: 0 }] },
          {
            title: "To Do",
            position: 0,
            cards: [
              { title: "Design", position: 1 },
              { title: "Spec", position: 0 },
            ],
          },
        ],
      });

      const createListReads = sql.filter(listRead);
      const createCardReads = sql.filter(cardRead);
      expect(createListReads).toHaveLength(1);
      expect(createCardReads).toHaveLength(1);
      expect(createListReads[0]).toMatch(listOrderBy);
      expect(createCardReads[0]).toMatch(cardOrderBy);

      // getBoardView issues the same two-level include — capture its SQL in isolation.
      sql.length = 0;
      await getBoardView(logged, created.id);

      const viewListReads = sql.filter(listRead);
      const viewCardReads = sql.filter(cardRead);
      expect(viewListReads).toHaveLength(1);
      expect(viewCardReads).toHaveLength(1);
      expect(viewListReads[0]).toMatch(listOrderBy);
      expect(viewCardReads[0]).toMatch(cardOrderBy);
    } finally {
      await logged.$disconnect();
    }
  });
});
