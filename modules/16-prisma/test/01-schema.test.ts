import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/client/client.js";
import {
  createBoard,
  createCard,
  createList,
  createUser,
  getBoard,
  getUser,
} from "../solution/01-schema.js";

// Per-file throwaway SQLite DB (fixed name — no Date.now/Math.random). Absolute path so the
// `prisma db push` CLI and the PrismaClient resolve to the exact same file.
const moduleRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_FILE = path.join(moduleRoot, "prisma", ".tmp-test-01.db");
const DB_URL = `file:${DB_FILE}`;

let prisma: PrismaClient;

function removeDb(): void {
  for (const file of [DB_FILE, `${DB_FILE}-journal`]) {
    if (existsSync(file)) unlinkSync(file);
  }
}

beforeAll(() => {
  removeDb();
  execSync("prisma db push", {
    cwd: moduleRoot,
    env: { ...process.env, DATABASE_URL: DB_URL },
    stdio: "ignore",
  });
  prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: DB_URL }) });
});

afterAll(async () => {
  await prisma.$disconnect();
  removeDb();
});

beforeEach(async () => {
  // Delete children before parents (FK order). Then clear SQLite's AUTOINCREMENT
  // bookkeeping so ids restart at 1 for a deterministic, isolated fixture.
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence");
});

describe("createUser / getUser (reference)", () => {
  it("createUser inserts a row with a DB-assigned id", async () => {
    const user = await createUser(prisma, { email: "grace@example.com", name: "Grace" });
    expect(user).toEqual({ id: 1, email: "grace@example.com", name: "Grace" });
  });

  it("getUser reads the row back, and returns null for an unknown id", async () => {
    const created = await createUser(prisma, { email: "alan@example.com", name: "Alan" });
    const found = await getUser(prisma, created.id);
    expect(found).toEqual({ id: 1, email: "alan@example.com", name: "Alan" });
    expect(await getUser(prisma, 999)).toBeNull();
  });
});

describe("createBoard / createList / createCard / getBoard (analog)", () => {
  it("creates the board→list→card chain with DB-assigned ids", async () => {
    const user = await createUser(prisma, {
      email: "edsger@example.com",
      name: "Edsger",
    });
    const board = await createBoard(prisma, { title: "Roadmap", ownerId: user.id });
    const list = await createList(prisma, {
      title: "To Do",
      position: 0,
      boardId: board.id,
    });
    const card = await createCard(prisma, {
      title: "Spec",
      position: 0,
      listId: list.id,
    });

    expect(board).toEqual({ id: 1, title: "Roadmap", ownerId: user.id });
    expect(list).toEqual({ id: 1, title: "To Do", position: 0, boardId: board.id });
    expect(card).toEqual({ id: 1, title: "Spec", position: 0, listId: list.id });
  });

  it("getBoard reads the board back, and returns null for an unknown id", async () => {
    const user = await createUser(prisma, { email: "ken@example.com", name: "Ken" });
    const board = await createBoard(prisma, { title: "Backlog", ownerId: user.id });

    expect(await getBoard(prisma, board.id)).toEqual({
      id: board.id,
      title: "Backlog",
      ownerId: user.id,
    });
    expect(await getBoard(prisma, 999)).toBeNull();
  });
});
