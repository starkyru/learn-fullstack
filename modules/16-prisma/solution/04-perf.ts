/**
 * Task 4 — Perf (EXT).
 *
 * The classic N+1: `getListsWithCardsNaive` fetches a board's lists (1 query) then loops, issuing a
 * `card.findMany` PER LIST — `1 + N` queries. `getListsWithCardsFast` returns identical data from a
 * single `list.findMany({ include: { cards: true } })`, which Prisma resolves in a constant handful
 * of queries regardless of N. The `@@index([listId, position])` in the schema keeps the per-list
 * card lookup off a table scan.
 *
 * `countQueries` proves it by subscribing to Prisma's `$on("query")` event — the client must be
 * constructed with `log: [{ emit: "event", level: "query" }]` (the task-4 test harness does this).
 *
 * EXT: this file ships complete — read the two implementations, then extend them (add a `select` to
 * fetch only `title`, page the cards, or add another naive→fast pair).
 */
import type { Prisma, PrismaClient } from "@prisma/client";

/** A list with its cards attached — the shape both implementations return. */
export type ListWithCards = Prisma.ListGetPayload<{ include: { cards: true } }>;

/** NAIVE: 1 query for the lists + 1 query PER list for its cards ⇒ `1 + N` queries. */
export async function getListsWithCardsNaive(
  prisma: PrismaClient,
  boardId: number,
): Promise<ListWithCards[]> {
  const lists = await prisma.list.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
  });
  const result: ListWithCards[] = [];
  for (const list of lists) {
    const cards = await prisma.card.findMany({
      where: { listId: list.id },
      orderBy: { position: "asc" },
    });
    result.push({ ...list, cards });
  }
  return result;
}

/** FAST: one `findMany` with `include` ⇒ a constant number of queries, identical data. */
export function getListsWithCardsFast(
  prisma: PrismaClient,
  boardId: number,
): Promise<ListWithCards[]> {
  return prisma.list.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
    include: { cards: { orderBy: { position: "asc" } } },
  });
}

/**
 * Prisma exposes no `off()` for `$on("query")`, so registering a fresh listener on every
 * `countQueries` call would leak listeners on the shared client and, worse, let every leaked
 * listener increment the *current* measurement — a second call would double-count, a third triple,
 * and so on. To avoid that we attach EXACTLY ONE listener per client (tracked in a `WeakSet`, so it
 * neither re-registers nor pins the client in memory) and route each query into whichever
 * measurement is currently `active`. Each call gets its own private counter; the `finally` restores
 * the previous `active` (supporting nesting) so counting is scoped strictly to `fn`'s lifetime and
 * cannot accumulate across calls.
 *
 * `$on("query")` only fires when the client was built with query-event logging; typing it exactly
 * would pin `PrismaClient`'s log generic, so we narrow to the one method we use at this boundary.
 */
type QueryEmitter = {
  $on(event: "query", callback: (event: { query: string }) => void): void;
};

const instrumentedClients = new WeakSet<object>();
let activeCounter: { count: number } | null = null;

export async function countQueries<T>(
  prisma: PrismaClient,
  fn: () => Promise<T>,
): Promise<{ result: T; queries: number }> {
  if (!instrumentedClients.has(prisma)) {
    (prisma as unknown as QueryEmitter).$on("query", () => {
      if (activeCounter) activeCounter.count += 1;
    });
    instrumentedClients.add(prisma);
  }

  const counter = { count: 0 };
  const previous = activeCounter;
  activeCounter = counter;
  try {
    const result = await fn();
    return { result, queries: counter.count };
  } finally {
    activeCounter = previous;
  }
}
