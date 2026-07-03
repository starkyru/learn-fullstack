import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  countQueries,
  getListsWithCardsFast,
  getListsWithCardsNaive,
} from "../solution/04-perf.js";

const moduleRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_FILE = path.join(moduleRoot, "prisma", ".tmp-test-04.db");
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
  // `log: [{ emit: "event", level: "query" }]` is what makes `$on("query")` fire.
  prisma = new PrismaClient({
    datasourceUrl: DB_URL,
    log: [{ emit: "event", level: "query" }],
  });
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

// A board with N=3 lists, each holding 2 cards.
async function seedBoard(): Promise<number> {
  const user = await prisma.user.create({ data: { email: "n1@example.com", name: "N" } });
  const board = await prisma.board.create({
    data: {
      title: "Big",
      ownerId: user.id,
      lists: {
        create: [0, 1, 2].map((p) => ({
          title: `L${p}`,
          position: p,
          cards: {
            create: [
              { title: `L${p}-c0`, position: 0 },
              { title: `L${p}-c1`, position: 1 },
            ],
          },
        })),
      },
    },
  });
  return board.id;
}

describe("N+1 vs include", () => {
  it("returns identical data while issuing fewer queries", async () => {
    const boardId = await seedBoard();

    const naive = await countQueries(prisma, () =>
      getListsWithCardsNaive(prisma, boardId),
    );
    const fast = await countQueries(prisma, () => getListsWithCardsFast(prisma, boardId));

    // Same data both ways.
    expect(fast.result).toEqual(naive.result);
    expect(fast.result.map((l) => l.title)).toEqual(["L0", "L1", "L2"]);
    expect(fast.result.map((l) => l.cards.length)).toEqual([2, 2, 2]);

    // Naive is exactly 1 (lists) + N (cards-per-list) = 1 + 3 = 4 queries.
    expect(naive.queries).toBe(4);
    // The include fix collapses that to a constant handful — strictly fewer than the N+1.
    expect(fast.queries).toBeLessThan(naive.queries);
  });

  it("counts each measurement in isolation — a second call is NOT inflated by the first", async () => {
    // `countQueries` attaches a `$on("query")` listener to the shared client but Prisma has no
    // `off()`. If it registered a NEW listener per call routed into the live counter, every leaked
    // listener would re-count the current run: call #2 would report 2x, call #3 3x. Repeating the
    // exact same measurement on the SAME client must yield the SAME count every time.
    const boardId = await seedBoard();

    // Ground truth measured at the true boundary (our OWN query listener), independent of the
    // value `countQueries` self-reports.
    let boundaryCount = 0;
    const stopAt = { done: false };
    (prisma as unknown as { $on(e: "query", cb: () => void): void }).$on("query", () => {
      if (!stopAt.done) boundaryCount += 1;
    });
    await getListsWithCardsNaive(prisma, boardId);
    stopAt.done = true;
    expect(boundaryCount).toBe(4); // 1 lists + 3 card lookups

    const first = await countQueries(prisma, () =>
      getListsWithCardsNaive(prisma, boardId),
    );
    const second = await countQueries(prisma, () =>
      getListsWithCardsNaive(prisma, boardId),
    );
    const third = await countQueries(prisma, () =>
      getListsWithCardsNaive(prisma, boardId),
    );

    // Every repeat is the independent, non-accumulating truth — not 4, 8, 12.
    expect(first.queries).toBe(4);
    expect(second.queries).toBe(4);
    expect(third.queries).toBe(4);
  });

  it("serves the per-list card lookup from the compound index, not a full table scan", async () => {
    // The N+1 fix is only fast because `card.findMany({ where: { listId }, orderBy: { position } })`
    // rides `@@index([listId, position])`. Query VOLUME alone can't prove that — assert the plan.
    const boardId = await seedBoard();
    const [list] = await prisma.list.findMany({ where: { boardId }, take: 1 });
    expect(list).toBeDefined();

    const plan = await prisma.$queryRawUnsafe<Array<{ detail: string }>>(
      "EXPLAIN QUERY PLAN SELECT `id`, `title`, `position`, `listId` FROM `Card` WHERE `listId` = ? ORDER BY `position` ASC",
      list!.id,
    );
    const detail = plan.map((row) => row.detail).join(" | ");

    // Indexed path: `SEARCH Card USING INDEX Card_listId_position_idx`. Without the index the plan
    // is `SCAN Card | USE TEMP B-TREE FOR ORDER BY` — no index name, and a sort step is added.
    expect(detail).toContain("USING INDEX Card_listId_position_idx");
    expect(detail).not.toContain("USE TEMP B-TREE FOR ORDER BY");
  });
});
