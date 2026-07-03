import { describe, expect, it } from "vitest";
import { boardReducer, type BoardState } from "../solution/04-board-reducer.js";

const initial: BoardState = { cards: [{ id: "c1", title: "One", columnId: "todo" }] };

describe("boardReducer", () => {
  it("adds a card without mutating the previous state", () => {
    const next = boardReducer(initial, {
      type: "add",
      card: { id: "c2", title: "Two", columnId: "todo" },
    });
    expect(next.cards).toHaveLength(2);
    expect(initial.cards).toHaveLength(1); // unchanged
  });

  it("renames the matching card", () => {
    const next = boardReducer(initial, { type: "rename", id: "c1", title: "Renamed" });
    expect(next.cards[0]?.title).toBe("Renamed");
  });

  it("moves the matching card to a new column", () => {
    const next = boardReducer(initial, { type: "move", id: "c1", toColumnId: "done" });
    expect(next.cards[0]?.columnId).toBe("done");
  });
});
