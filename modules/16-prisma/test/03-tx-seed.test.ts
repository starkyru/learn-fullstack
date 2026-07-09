import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/client/client.js";
import { moveCard, seed } from "../solution/03-tx-seed.js";

const moduleRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_FILE = path.join(moduleRoot, "prisma", ".tmp-test-03.db");
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
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
});

describe("seed", () => {
  it("populates the deterministic board, lists and cards", async () => {
    await seed(prisma);

    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.board.count()).toBe(1);
    expect(await prisma.list.count()).toBe(2);
    expect(await prisma.card.count()).toBe(3);

    const lists = await prisma.list.findMany({
      orderBy: { position: "asc" },
      include: { cards: { orderBy: { position: "asc" } } },
    });
    expect(lists.map((l) => l.title)).toEqual(["To Do", "Doing"]);
    const todo = lists[0];
    const doing = lists[1];
    expect(todo?.cards.map((c) => c.title)).toEqual(["Spec", "Design"]);
    expect(doing?.cards.map((c) => c.title)).toEqual(["Build"]);
  });
});

describe("moveCard (interactive transaction)", () => {
  it("moves a card to another list + position and persists it", async () => {
    await seed(prisma);
    const todo = await prisma.list.findFirstOrThrow({ where: { title: "To Do" } });
    const build = await prisma.card.findFirstOrThrow({ where: { title: "Build" } });

    const moved = await moveCard(prisma, {
      cardId: build.id,
      toListId: todo.id,
      toPosition: 2,
    });
    expect(moved.listId).toBe(todo.id);
    expect(moved.position).toBe(2);

    const reread = await prisma.card.findUniqueOrThrow({ where: { id: build.id } });
    expect(reread.listId).toBe(todo.id);
    expect(reread.position).toBe(2);
  });

  it("rolls back the whole move when the callback throws (atomic)", async () => {
    await seed(prisma);
    const doing = await prisma.list.findFirstOrThrow({ where: { title: "Doing" } });
    const todo = await prisma.list.findFirstOrThrow({ where: { title: "To Do" } });
    const build = await prisma.card.findFirstOrThrow({ where: { title: "Build" } });

    await expect(
      moveCard(prisma, { cardId: build.id, toListId: todo.id, toPosition: -1 }),
    ).rejects.toThrow(/invalid position/);

    // The update inside the transaction must have been rolled back.
    const after = await prisma.card.findUniqueOrThrow({ where: { id: build.id } });
    expect(after.listId).toBe(doing.id);
    expect(after.position).toBe(0);
  });
});
