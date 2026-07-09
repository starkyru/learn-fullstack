/**
 * Task 2 — Relations & queries (TODO).
 *
 * A nested WRITE inserts a whole board→lists→cards tree in one call; a nested READ pulls it back
 * FULLY TYPED. The return type is `Prisma.BoardGetPayload<{ include: … }>`, so
 * `board.lists[0]?.cards[0]?.title` is checked at compile time — no `any`, no manual joins.
 *
 * Both functions below throw `TODO` — implement them. Tests import from `solution/`; flip to
 * `../src/02-relations.js` to grade your own build.
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
 * TODO: nested WRITE. One `prisma.board.create` should insert the board, its lists, and each list's
 * cards (`data: { lists: { create: [{ cards: { create: [...] } }] } }`), then read the tree back
 * with a two-level `include` (lists + cards, each `orderBy: { position: "asc" }`) and return it.
 */
export function createBoardWithListsAndCards(
  _prisma: PrismaClient,
  _input: BoardInput,
): Promise<BoardView> {
  throw new Error("TODO");
}

/**
 * TODO: nested READ. `prisma.board.findUnique({ where: { id }, include: { lists: { include: {
 * cards: true } } } })` — lists and cards ordered by `position` — or `null` when absent.
 */
export function getBoardView(
  _prisma: PrismaClient,
  _boardId: number,
): Promise<BoardView | null> {
  throw new Error("TODO");
}
