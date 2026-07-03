import { z } from "zod";
import type { User } from "@learn-fullstack/shared";

/**
 * Board domain + a Web-standard (no running server, no Node APIs) board service.
 *
 * The Kanban capstone's data layer lands in M1 (Prisma via @learn-fullstack/db). For
 * this M0 vertical slice the store is an in-memory implementation of the same `BoardRepo`
 * interface the Server Component and the Server Action depend on — so the slice is fully
 * runnable and testable with zero infrastructure, and swapping in the real repo later is a
 * one-line change at the composition root (app/board/page.tsx).
 */

export interface Card {
  id: string;
  title: string;
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  /** Reuses the shared wire contract's `User` so client + server agree on the owner shape. */
  owner: User;
  columns: Column[];
}

/** Input the create-card Server Action validates, then hands to `repo.createCard`. */
export const CreateCardInput = z.object({
  boardId: z.string({ required_error: "Board is required" }).min(1, "Board is required"),
  columnId: z
    .string({ required_error: "Column is required" })
    .min(1, "Column is required"),
  title: z.string({ required_error: "Title is required" }).min(1, "Title is required"),
});
export type CreateCardInput = z.infer<typeof CreateCardInput>;

/**
 * The narrow port the RSC page and the Server Action consume. The action never imports a
 * concrete store; it receives one as an injected dep, which is what makes it unit-testable.
 */
export interface BoardRepo {
  getBoard(boardId: string): Promise<Board>;
  createCard(input: CreateCardInput): Promise<Card>;
}

const OWNER: User = { id: "u1", email: "owner@kanban.dev", name: "Ada" };

function seedBoard(): Board {
  return {
    id: "b1",
    title: "Launch Plan",
    owner: OWNER,
    columns: [
      {
        id: "todo",
        title: "To Do",
        cards: [{ id: "c1", title: "Draft the roadmap", columnId: "todo" }],
      },
      {
        id: "doing",
        title: "In Progress",
        cards: [{ id: "c2", title: "Wire the board RSC", columnId: "doing" }],
      },
      { id: "done", title: "Done", cards: [] },
    ],
  };
}

/**
 * In-memory `BoardRepo`. Ids are derived from a monotonic counter seeded off the current
 * card count (never `Date.now`/`Math.random`), so created ids are deterministic and the
 * slice is reproducible in tests.
 */
export class InMemoryBoardStore implements BoardRepo {
  private readonly boards = new Map<string, Board>();
  private cardSeq: number;

  constructor(initial: Board = seedBoard()) {
    this.boards.set(initial.id, initial);
    const existing = initial.columns.reduce((n, col) => n + col.cards.length, 0);
    this.cardSeq = existing;
  }

  async getBoard(boardId: string): Promise<Board> {
    const board = this.boards.get(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);
    return board;
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const board = this.boards.get(input.boardId);
    if (!board) throw new Error(`Board not found: ${input.boardId}`);
    const column = board.columns.find((c) => c.id === input.columnId);
    if (!column) throw new Error(`Column not found: ${input.columnId}`);

    this.cardSeq += 1;
    const card: Card = {
      id: `c${this.cardSeq}`,
      title: input.title,
      columnId: input.columnId,
    };
    column.cards.push(card);
    return card;
  }
}

/** The default store the app's composition root binds. M1 replaces this with the DB repo. */
export const boardStore = new InMemoryBoardStore();
