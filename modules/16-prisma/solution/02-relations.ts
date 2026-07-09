/**
 * Task 2 — Relations & queries (TODO).
 *
 * A nested WRITE inserts a whole board→lists→cards tree in one call; a nested READ pulls it back
 * FULLY TYPED. The return type is `Prisma.BoardGetPayload<{ include: … }>`, so
 * `board.lists[0]?.cards[0]?.title` is checked at compile time — no `any`, no manual joins.
 */
import type { Prisma, PrismaClient } from "../generated/client/client.js";

export interface CardInput {
  title: string;
  position: number;
}

export interface ListInput {
  title: string;
  position: number;
  cards: CardInput[];
}

export interface BoardInput {
  title: string;
  ownerId: number;
  lists: ListInput[];
}

/**
 * A board with its lists, and each list with its cards — the exact shape the nested `include`
 * returns, derived from the schema so it stays in sync automatically.
 */
export type BoardView = Prisma.BoardGetPayload<{
  include: { lists: { include: { cards: true } } };
}>;

/**
 * Nested WRITE: one `create` inserts the board, its lists, and each list's cards, then reads the
 * whole tree back via `include` — returning a fully-typed `BoardView`.
 */
export function createBoardWithListsAndCards(
  prisma: PrismaClient,
  input: BoardInput,
): Promise<BoardView> {
  return prisma.board.create({
    data: {
      title: input.title,
      ownerId: input.ownerId,
      lists: {
        create: input.lists.map((list) => ({
          title: list.title,
          position: list.position,
          cards: {
            create: list.cards.map((card) => ({
              title: card.title,
              position: card.position,
            })),
          },
        })),
      },
    },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
    },
  });
}

/**
 * Nested READ: one `findUnique` with a two-level `include` returns the board→lists→cards tree
 * (lists and cards ordered by `position`), or `null` when the board does not exist.
 */
export function getBoardView(
  prisma: PrismaClient,
  boardId: number,
): Promise<BoardView | null> {
  return prisma.board.findUnique({
    where: { id: boardId },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
    },
  });
}
