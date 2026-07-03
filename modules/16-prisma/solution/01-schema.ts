/**
 * Task 1 — Schema & migrate (WORKED EXAMPLE).
 *
 * The schema lives in `prisma/schema.prisma`; `prisma db push` / `migrate dev` turns it into tables
 * (see the README "Prisma commands"). These functions are the typed data-access layer on top.
 *
 * The `User` functions are the fully-solved REFERENCE. The `Board`/`List`/`Card` functions are the
 * ANALOG — the SAME two-line shape (`prisma.<model>.create` / `.findUnique`) at other models, so
 * building them is pure pattern reuse. In `src/` the analog throws; here it is solved.
 *
 * Every function takes a `PrismaClient` so tests inject one bound to a throwaway SQLite database —
 * no global client, no hidden connection.
 */
import type { PrismaClient } from "@prisma/client";

// Row types re-derived from the client so callers don't reach into generated internals.
export type User = { id: number; email: string; name: string };
export type Board = { id: number; title: string; ownerId: number };
export type List = { id: number; title: string; position: number; boardId: number };
export type Card = { id: number; title: string; position: number; listId: number };

export interface CreateUserInput {
  email: string;
  name: string;
}

/** REFERENCE: insert a user and return the created row (id assigned by the DB). */
export function createUser(prisma: PrismaClient, input: CreateUserInput): Promise<User> {
  return prisma.user.create({ data: { email: input.email, name: input.name } });
}

/** REFERENCE: read one user by id, or `null` when it does not exist. */
export function getUser(prisma: PrismaClient, id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export interface CreateBoardInput {
  title: string;
  ownerId: number;
}

export interface CreateListInput {
  title: string;
  position: number;
  boardId: number;
}

export interface CreateCardInput {
  title: string;
  position: number;
  listId: number;
}

/** ANALOG of `createUser`, at `Board`. */
export function createBoard(
  prisma: PrismaClient,
  input: CreateBoardInput,
): Promise<Board> {
  return prisma.board.create({
    data: { title: input.title, ownerId: input.ownerId },
  });
}

/** ANALOG of `createUser`, at `List`. */
export function createList(prisma: PrismaClient, input: CreateListInput): Promise<List> {
  return prisma.list.create({
    data: { title: input.title, position: input.position, boardId: input.boardId },
  });
}

/** ANALOG of `createUser`, at `Card`. */
export function createCard(prisma: PrismaClient, input: CreateCardInput): Promise<Card> {
  return prisma.card.create({
    data: { title: input.title, position: input.position, listId: input.listId },
  });
}

/** ANALOG of `getUser`, at `Board`. */
export function getBoard(prisma: PrismaClient, id: number): Promise<Board | null> {
  return prisma.board.findUnique({ where: { id } });
}
