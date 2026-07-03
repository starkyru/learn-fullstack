import { describe, expect, it } from "vitest";
import { InMemoryBoardStore } from "../src/board/board-service.js";

describe("InMemoryBoardStore", () => {
  it("getBoard returns the seeded board: 3 columns with the seeded cards", async () => {
    const store = new InMemoryBoardStore();
    const board = await store.getBoard("b1");

    expect(board.id).toBe("b1");
    expect(board.owner.email).toBe("owner@kanban.dev");
    expect(board.columns.map((c) => c.title)).toEqual(["To Do", "In Progress", "Done"]);
    expect(board.columns.map((c) => c.cards.length)).toEqual([1, 1, 0]);
  });

  it("createCard appends to the target column with a deterministic id and returns it", async () => {
    const store = new InMemoryBoardStore();

    const card = await store.createCard({
      boardId: "b1",
      columnId: "done",
      title: "Ship the slice",
    });

    // Seed has 2 cards, so the next id is c3 — never Date.now/Math.random.
    expect(card).toEqual({ id: "c3", title: "Ship the slice", columnId: "done" });

    const board = await store.getBoard("b1");
    const done = board.columns.find((c) => c.id === "done");
    expect(done?.cards).toEqual([
      { id: "c3", title: "Ship the slice", columnId: "done" },
    ]);
  });

  it("createCard rejects an unknown column", async () => {
    const store = new InMemoryBoardStore();
    await expect(
      store.createCard({ boardId: "b1", columnId: "nope", title: "x" }),
    ).rejects.toThrow("Column not found: nope");
  });
});
