/**
 * Task 3 — Transactions & seed (TODO).
 *
 * `moveCard` relocates a card inside a single INTERACTIVE transaction (`$transaction(async (tx) =>
 * …)`): every write uses `tx`, so if the callback throws the move rolls back atomically — the row
 * is left exactly as it was.
 *
 * `seed` populates DETERMINISTIC data (fixed emails/titles/positions, no `Date.now`/`Math.random`)
 * — the shared fixture both the web and worker apps build on.
 *
 * Both functions below throw `TODO` — implement them. Tests import from `solution/`.
 */
import type { PrismaClient } from "../generated/client/client.js";
import type { Card } from "./01-schema.js";

export interface MoveCardInput {
  cardId: number;
  toListId: number;
  toPosition: number;
}

/**
 * TODO: move `cardId` to `toListId`/`toPosition` inside ONE `prisma.$transaction(async (tx) => …)`.
 * Update the card via `tx.card.update`, then `throw` when `toPosition < 0` — the throw must roll the
 * update back (the card keeps its original list + position). Return the updated card on success.
 */
export function moveCard(_prisma: PrismaClient, _input: MoveCardInput): Promise<Card> {
  throw new Error("TODO");
}

/**
 * TODO: populate a deterministic board — user "ada@example.com"/"Ada", board "Roadmap", list
 * "To Do" (pos 0) with cards "Spec"(0)/"Design"(1), list "Doing" (pos 1) with card "Build"(0).
 * Use a nested `prisma.board.create` so the whole tree is written in one call.
 */
export function seed(_prisma: PrismaClient): Promise<void> {
  throw new Error("TODO");
}
