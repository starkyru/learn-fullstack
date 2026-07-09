/**
 * Task 3 — Transactions & seed (TODO).
 *
 * `moveCard` relocates a card inside a single INTERACTIVE transaction (`$transaction(async (tx) =>
 * …)`): every write uses `tx`, so if the callback throws the move rolls back atomically — the row
 * is left exactly as it was.
 *
 * `seed` populates DETERMINISTIC data (fixed emails/titles/positions, no `Date.now`/`Math.random`)
 * — the shared fixture both the web and worker apps build on.
 */
import type { PrismaClient } from "../generated/client/client.js";
import type { Card } from "./01-schema.js";

export interface MoveCardInput {
  cardId: number;
  toListId: number;
  toPosition: number;
}

/**
 * Move `cardId` to `toListId` at `toPosition`, atomically.
 *
 * The update and the validation run in ONE interactive transaction. If `toPosition` is negative we
 * `throw` AFTER the update — proving rollback: the card keeps its original list and position rather
 * than being left half-moved.
 */
export function moveCard(prisma: PrismaClient, input: MoveCardInput): Promise<Card> {
  const { cardId, toListId, toPosition } = input;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.card.update({
      where: { id: cardId },
      data: { listId: toListId, position: toPosition },
    });
    if (toPosition < 0) {
      throw new Error(`invalid position ${toPosition}: must be >= 0`);
    }
    return updated;
  });
}

/**
 * Populate a deterministic board: user "ada", board "Roadmap", lists "To Do" (2 cards) and
 * "Doing" (1 card). Nested `create` writes the whole tree in one call.
 */
export async function seed(prisma: PrismaClient): Promise<void> {
  const user = await prisma.user.create({
    data: { email: "ada@example.com", name: "Ada" },
  });
  await prisma.board.create({
    data: {
      title: "Roadmap",
      ownerId: user.id,
      lists: {
        create: [
          {
            title: "To Do",
            position: 0,
            cards: {
              create: [
                { title: "Spec", position: 0 },
                { title: "Design", position: 1 },
              ],
            },
          },
          {
            title: "Doing",
            position: 1,
            cards: { create: [{ title: "Build", position: 0 }] },
          },
        ],
      },
    },
  });
}
