import { describe, expect, it } from "vitest";
import type { BoardState } from "../solution/01-reducer.js";
import { moveCard, renameCard } from "../solution/01-reducer.js";

/** A fresh fixture per test so mutation bugs can't leak between assertions. */
function board(): BoardState {
  return {
    lists: [
      {
        id: "todo",
        cards: [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
          { id: "c", title: "C" },
        ],
      },
      { id: "doing", cards: [{ id: "d", title: "D" }] },
    ],
  };
}

describe("Task 1 — moveCard reducer (worked example, TDD'd)", () => {
  it("moves a card to another list at the requested index", () => {
    const before = board();
    const after = moveCard(before, {
      type: "moveCard",
      cardId: "a",
      from: "todo",
      to: "doing",
      toIndex: 1,
    });

    expect(after.lists).toEqual([
      {
        id: "todo",
        cards: [
          { id: "b", title: "B" },
          { id: "c", title: "C" },
        ],
      },
      {
        id: "doing",
        cards: [
          { id: "d", title: "D" },
          { id: "a", title: "A" },
        ],
      },
    ]);
  });

  it("inserts into a target list with several cards at toIndex 0 (prepend, not append)", () => {
    const before: BoardState = {
      lists: [
        {
          id: "todo",
          cards: [
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ],
        },
        {
          id: "doing",
          cards: [
            { id: "d", title: "D" },
            { id: "e", title: "E" },
            { id: "f", title: "F" },
          ],
        },
      ],
    };
    const after = moveCard(before, {
      type: "moveCard",
      cardId: "a",
      from: "todo",
      to: "doing",
      toIndex: 0,
    });

    expect(after.lists[1]?.cards).toEqual([
      { id: "a", title: "A" },
      { id: "d", title: "D" },
      { id: "e", title: "E" },
      { id: "f", title: "F" },
    ]);
  });

  it("inserts into a target list with several cards at a middle index (not append)", () => {
    const before: BoardState = {
      lists: [
        {
          id: "todo",
          cards: [
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ],
        },
        {
          id: "doing",
          cards: [
            { id: "d", title: "D" },
            { id: "e", title: "E" },
            { id: "f", title: "F" },
          ],
        },
      ],
    };
    const after = moveCard(before, {
      type: "moveCard",
      cardId: "a",
      from: "todo",
      to: "doing",
      toIndex: 2,
    });

    expect(after.lists[1]?.cards).toEqual([
      { id: "d", title: "D" },
      { id: "e", title: "E" },
      { id: "a", title: "A" },
      { id: "f", title: "F" },
    ]);
  });

  it("reorders within the same list (remove-then-insert semantics)", () => {
    const after = moveCard(board(), {
      type: "moveCard",
      cardId: "c",
      from: "todo",
      to: "todo",
      toIndex: 0,
    });

    expect(after.lists[0]).toEqual({
      id: "todo",
      cards: [
        { id: "c", title: "C" },
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ],
    });
  });

  it("is immutable: input untouched, unrelated lists keep their reference", () => {
    const before = board();
    const doingBefore = before.lists[1];
    const after = moveCard(before, {
      type: "moveCard",
      cardId: "a",
      from: "todo",
      to: "todo",
      toIndex: 2,
    });

    // input object is not mutated
    expect(before.lists[0]?.cards.map((c) => c.id)).toEqual(["a", "b", "c"]);
    // a fresh state + fresh source list
    expect(after).not.toBe(before);
    expect(after.lists[0]).not.toBe(before.lists[0]);
    // the untouched "doing" list is the SAME reference (structural sharing)
    expect(after.lists[1]).toBe(doingBefore);
  });

  it("returns the same state reference when the card is not found", () => {
    const before = board();
    const after = moveCard(before, {
      type: "moveCard",
      cardId: "ghost",
      from: "todo",
      to: "doing",
      toIndex: 0,
    });
    expect(after).toBe(before);
  });
});

describe("Task 1 — renameCard reducer (your analog)", () => {
  it("renames exactly the target card", () => {
    const after = renameCard(board(), {
      type: "renameCard",
      cardId: "b",
      title: "B renamed",
    });

    expect(after.lists[0]?.cards).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "B renamed" },
      { id: "c", title: "C" },
    ]);
  });

  it("is immutable and preserves unrelated lists by reference", () => {
    const before = board();
    const doingBefore = before.lists[1];
    const after = renameCard(before, { type: "renameCard", cardId: "a", title: "A2" });

    expect(before.lists[0]?.cards[0]).toEqual({ id: "a", title: "A" }); // input untouched
    expect(after).not.toBe(before);
    expect(after.lists[0]).not.toBe(before.lists[0]); // owner list cloned
    expect(after.lists[1]).toBe(doingBefore); // untouched list shared
  });

  it("returns the same state reference when no card matches", () => {
    const before = board();
    expect(renameCard(before, { type: "renameCard", cardId: "ghost", title: "x" })).toBe(
      before,
    );
  });
});
