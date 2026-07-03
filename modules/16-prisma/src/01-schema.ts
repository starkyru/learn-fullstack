/**
 * Task 1 — Schema & migrate (WORKED EXAMPLE).
 *
 * The schema lives in `prisma/schema.prisma`; `prisma db push` / `migrate dev` turns it into tables
 * (see the README "Prisma commands"). These functions are the typed data-access layer on top.
 *
 * The `User` functions below are the fully-solved REFERENCE. YOUR TURN: implement the
 * `Board`/`List`/`Card` ANALOG by mirroring them — the SAME two-line shape
 * (`prisma.<model>.create` / `.findUnique`) at other models.
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

/** YOUR TURN — ANALOG of `createUser`, at `Board` (`prisma.board.create`). */
export function createBoard(
  _prisma: PrismaClient,
  _input: CreateBoardInput,
): Promise<Board> {
  throw new Error("TODO: implement createBoard by mirroring createUser at prisma.board");
}

/** YOUR TURN — ANALOG of `createUser`, at `List` (`prisma.list.create`). */
export function createList(
  _prisma: PrismaClient,
  _input: CreateListInput,
): Promise<List> {
  throw new Error("TODO: implement createList by mirroring createUser at prisma.list");
}

/** YOUR TURN — ANALOG of `createUser`, at `Card` (`prisma.card.create`). */
export function createCard(
  _prisma: PrismaClient,
  _input: CreateCardInput,
): Promise<Card> {
  throw new Error("TODO: implement createCard by mirroring createUser at prisma.card");
}

/** YOUR TURN — ANALOG of `getUser`, at `Board` (`prisma.board.findUnique`). */
export function getBoard(_prisma: PrismaClient, _id: number): Promise<Board | null> {
  throw new Error("TODO: implement getBoard by mirroring getUser at prisma.board");
}
