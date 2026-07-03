/**
 * Task 1 — Kanban vertical slice (EXT, worked reference).
 *
 * The Kanban capstone is Next RSC + Server Actions + Prisma + Auth.js. Here we assemble the
 * SLICE LOGIC that stack revolves around, testable without Next/Prisma/Auth.js on real ports:
 *
 *   - a `BoardService` over an INJECTED `BoardRepo` (the in-memory repo below is Prisma-shaped:
 *     async, id-in, row-out) so board CRUD is exercised end-to-end without a database;
 *   - an OPTIMISTIC drag-move (`moveReducer` + `runOptimisticMove`) that applies the move to
 *     local state IMMEDIATELY, then reconciles to the server's authoritative board when the
 *     action settles — or rolls back to the pre-move board if the action fails. This is the pure
 *     core that a React `useOptimistic` reducer consumes (see module 25);
 *   - an Auth.js-style `requireSession` guard the service runs before every mutation, so an
 *     unauthenticated caller is rejected before any write.
 *
 * Ids come from an INJECTED `IdSource` (never `Math.random()`); timestamps are not needed here.
 */
import { z } from "zod";

export type Column = "todo" | "doing" | "done";
export const COLUMNS: readonly Column[] = ["todo", "doing", "done"];

export interface Card {
  id: string;
  title: string;
  column: Column;
  /** Insertion order across the board — stable so board snapshots compare exactly. */
  order: number;
}

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  cards: Card[];
}

/** Auth.js `Session` shape (the subset the slice authorizes against). */
export interface Session {
  user: { id: string; email: string };
  expires: string;
}

/** Injected opaque id source — deterministic under test, never `Math.random()`. */
export interface IdSource {
  next(): string;
}

/**
 * The Auth.js-style guard every mutation runs first. Returns the authenticated user's id, or
 * throws `unauthenticated` when there is no session/user — so a mutation can `requireSession`
 * up front and thread the trusted `ownerId` through.
 */
export function requireSession(session: Session | null): string {
  if (!session?.user?.id) throw new Error("unauthenticated");
  return session.user.id;
}

/** Prisma-shaped repo boundary: the service depends on THIS, not on `db` directly. */
export interface BoardRepo {
  createBoard(input: { id: string; title: string; ownerId: string }): Promise<Board>;
  addCard(input: { id: string; boardId: string; title: string }): Promise<Card>;
  moveCard(input: { boardId: string; cardId: string; to: Column }): Promise<Board>;
  getBoard(boardId: string): Promise<Board | null>;
}

/**
 * A genuine in-memory implementation of `BoardRepo` (NOT a mock — it's the injected boundary's
 * real impl for tests). New cards land in `todo` at the end; a move only changes a card's column,
 * preserving its `order` so board snapshots stay comparable.
 */
export function createInMemoryBoardRepo(): BoardRepo {
  const boards = new Map<string, Board>();

  const require = (boardId: string): Board => {
    const board = boards.get(boardId);
    if (!board) throw new Error(`board not found: ${boardId}`);
    return board;
  };

  return {
    async createBoard({ id, title, ownerId }) {
      const board: Board = { id, title, ownerId, cards: [] };
      boards.set(id, board);
      return board;
    },
    async addCard({ id, boardId, title }) {
      const board = require(boardId);
      const card: Card = { id, title, column: "todo", order: board.cards.length };
      board.cards.push(card);
      return card;
    },
    async moveCard({ boardId, cardId, to }) {
      const board = require(boardId);
      const card = board.cards.find((c) => c.id === cardId);
      if (!card) throw new Error(`card not found: ${cardId}`);
      card.column = to;
      return board;
    },
    async getBoard(boardId) {
      return boards.get(boardId) ?? null;
    },
  };
}

const CreateBoardInput = z.object({
  title: z.string().min(1, "Board title is required"),
});
const AddCardInput = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1, "Card title is required"),
});

/**
 * Board CRUD, guarded by Auth.js sessions. Every mutation `requireSession`s first (so an
 * unauthenticated caller never reaches the repo), validates its input with zod, then persists
 * through the injected repo. Reads are open.
 */
export class BoardService {
  constructor(
    private readonly repo: BoardRepo,
    private readonly ids: IdSource,
  ) {}

  async createBoard(session: Session | null, input: { title: string }): Promise<Board> {
    const ownerId = requireSession(session);
    const { title } = CreateBoardInput.parse(input);
    return this.repo.createBoard({ id: this.ids.next(), title, ownerId });
  }

  async addCard(
    session: Session | null,
    input: { boardId: string; title: string },
  ): Promise<Card> {
    requireSession(session);
    const { boardId, title } = AddCardInput.parse(input);
    return this.repo.addCard({ id: this.ids.next(), boardId, title });
  }

  async moveCard(session: Session | null, move: BoardMove): Promise<Board> {
    requireSession(session);
    return this.repo.moveCard(move);
  }

  async getBoard(boardId: string): Promise<Board | null> {
    return this.repo.getBoard(boardId);
  }
}

export interface BoardMove {
  boardId: string;
  cardId: string;
  to: Column;
}

/**
 * Pure optimistic reducer: return a NEW board with the moved card in its new column. Never
 * mutates its input — the caller shows the result instantly while the real move is in flight.
 */
export function moveReducer(board: Board, move: BoardMove): Board {
  return {
    ...board,
    cards: board.cards.map((c) => (c.id === move.cardId ? { ...c, column: move.to } : c)),
  };
}

export type MovePhase = "optimistic" | "settled" | "rolledback";
export interface MoveOutcome {
  phase: MovePhase;
  board: Board;
}

/**
 * The optimistic drag-move runner. `emit` is called SYNCHRONOUSLY with the optimistic board
 * (card already moved) before `settle` is awaited, so the UI updates immediately. When `settle`
 * resolves we `emit` its AUTHORITATIVE board (reconcile — the server may have reordered/renamed);
 * if `settle` rejects we `emit` the ORIGINAL board (rollback) and resolve to it.
 */
export async function runOptimisticMove(opts: {
  board: Board;
  move: BoardMove;
  settle: (move: BoardMove) => Promise<Board>;
  emit: (outcome: MoveOutcome) => void;
}): Promise<Board> {
  const { board, move, settle, emit } = opts;
  emit({ phase: "optimistic", board: moveReducer(board, move) });
  try {
    const settled = await settle(move);
    emit({ phase: "settled", board: settled });
    return settled;
  } catch {
    emit({ phase: "rolledback", board });
    return board;
  }
}
