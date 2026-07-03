import { describe, expect, it } from "vitest";
import {
  BoardService,
  createInMemoryBoardRepo,
  moveReducer,
  requireSession,
  runOptimisticMove,
  type Board,
  type BoardMove,
  type IdSource,
  type MoveOutcome,
  type Session,
} from "../solution/01-kanban-slice.js";

// Deterministic id source — no Math.random(). Ids are "id-1", "id-2", …
function seqIds(): IdSource {
  let n = 0;
  return { next: () => `id-${++n}` };
}

const SESSION: Session = {
  user: { id: "user-1", email: "ada@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
};

describe("BoardService (CRUD over injected repo, Auth.js-guarded)", () => {
  it("creates a board, adds cards, and moves one — exact board state", async () => {
    const service = new BoardService(createInMemoryBoardRepo(), seqIds());
    const board = await service.createBoard(SESSION, { title: "Sprint 1" });
    await service.addCard(SESSION, { boardId: board.id, title: "Design" });
    await service.addCard(SESSION, { boardId: board.id, title: "Build" });
    await service.moveCard(SESSION, { boardId: board.id, cardId: "id-3", to: "done" });

    // board.id is "id-1" (first minted), then the two cards are "id-2"/"id-3".
    expect(await service.getBoard("id-1")).toEqual({
      id: "id-1",
      title: "Sprint 1",
      ownerId: "user-1",
      cards: [
        { id: "id-2", title: "Design", column: "todo", order: 0 },
        { id: "id-3", title: "Build", column: "done", order: 1 },
      ],
    });
  });

  it("rejects an unauthenticated mutation and never touches the repo", async () => {
    const repo = createInMemoryBoardRepo();
    const service = new BoardService(repo, seqIds());
    const board = await service.createBoard(SESSION, { title: "Sprint 1" });

    await expect(
      service.addCard(null, { boardId: board.id, title: "Ghost" }),
    ).rejects.toThrow("unauthenticated");
    // The guarded write never ran: the board still has zero cards.
    expect((await service.getBoard(board.id))?.cards).toEqual([]);
  });

  it("rejects createBoard for an unauthenticated caller (guard, not a fallback owner)", async () => {
    const repo = createInMemoryBoardRepo();
    const service = new BoardService(repo, seqIds());

    await expect(service.createBoard(null, { title: "Sprint 1" })).rejects.toThrow(
      "unauthenticated",
    );
    // The guard rejected before minting an id / persisting — no board exists.
    expect(await service.getBoard("id-1")).toBeNull();
  });

  it("rejects moveCard for an unauthenticated caller and never moves the card", async () => {
    const service = new BoardService(createInMemoryBoardRepo(), seqIds());
    const board = await service.createBoard(SESSION, { title: "Sprint 1" });
    await service.addCard(SESSION, { boardId: board.id, title: "Design" }); // card "id-2" in "todo"

    await expect(
      service.moveCard(null, { boardId: board.id, cardId: "id-2", to: "done" }),
    ).rejects.toThrow("unauthenticated");
    // The guard blocked the write: the card is still in its original column.
    const after = await service.getBoard(board.id);
    expect(after?.cards[0]?.column).toBe("todo");
  });
});

describe("requireSession", () => {
  it("returns the user id for a valid session and throws for none", () => {
    expect(requireSession(SESSION)).toBe("user-1");
    expect(() => requireSession(null)).toThrow("unauthenticated");
  });
});

describe("optimistic drag-move", () => {
  const START: Board = {
    id: "b1",
    title: "Board",
    ownerId: "user-1",
    cards: [{ id: "c1", title: "Ship it", column: "todo", order: 0 }],
  };
  const MOVE: BoardMove = { boardId: "b1", cardId: "c1", to: "done" };

  it("moveReducer moves the card without mutating the input", () => {
    const next = moveReducer(START, MOVE);
    expect(next.cards[0]?.column).toBe("done");
    // Input untouched — the optimistic layer must never mutate committed state.
    expect(START.cards[0]?.column).toBe("todo");
    expect(next).not.toBe(START);
  });

  it("shows the move immediately, then reconciles to the server's board", async () => {
    let settle!: (board: Board) => void;
    const pending = new Promise<Board>((res) => (settle = res));
    const outcomes: MoveOutcome[] = [];

    const done = runOptimisticMove({
      board: START,
      move: MOVE,
      settle: () => pending,
      emit: (o) => outcomes.push(o),
    });

    // Optimistic emit is SYNCHRONOUS — the card is already in "done" before settle resolves.
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.phase).toBe("optimistic");
    expect(outcomes[0]?.board.cards[0]?.column).toBe("done");

    // Server truth reorders the card's `order` — the reconcile must adopt it verbatim.
    const serverBoard: Board = {
      ...START,
      cards: [{ id: "c1", title: "Ship it", column: "done", order: 5 }],
    };
    settle(serverBoard);
    const result = await done;

    expect(outcomes[1]).toEqual({ phase: "settled", board: serverBoard });
    expect(result).toBe(serverBoard);
  });

  it("rolls back to the pre-move board when the action fails", async () => {
    const outcomes: MoveOutcome[] = [];
    const result = await runOptimisticMove({
      board: START,
      move: MOVE,
      settle: () => Promise.reject(new Error("network down")),
      emit: (o) => outcomes.push(o),
    });

    expect(outcomes.map((o) => o.phase)).toEqual(["optimistic", "rolledback"]);
    // Rollback returns the ORIGINAL board — the card is back in "todo".
    expect(outcomes[1]?.board).toBe(START);
    expect(result.cards[0]?.column).toBe("todo");
  });
});
