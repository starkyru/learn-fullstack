import { describe, expect, it } from "vitest";
import {
  boardReducer,
  cardAdded,
  cardMoved,
  cardRemoved,
  columnFilterSet,
  filtersReducer,
  queryChanged,
  selectVisibleCards,
  type BoardState,
  type Card,
  type RootState,
} from "../solution/01-slices.js";

const card = (id: string, title: string, columnId: string): Card => ({
  id,
  title,
  columnId,
});

describe("boardSlice reducer", () => {
  it("adds, moves, and removes cards immutably", () => {
    const empty: BoardState = { cards: [] };

    const withOne = boardReducer(empty, cardAdded(card("1", "Ship", "todo")));
    expect(withOne.cards).toEqual([card("1", "Ship", "todo")]);
    expect(empty.cards).toEqual([]); // original untouched (Immer)

    const moved = boardReducer(withOne, cardMoved({ id: "1", toColumnId: "doing" }));
    expect(moved.cards[0]!.columnId).toBe("doing");

    const removed = boardReducer(moved, cardRemoved("1"));
    expect(removed.cards).toEqual([]);
  });

  it("cardMoved is a no-op for an unknown id", () => {
    const state: BoardState = { cards: [card("1", "Ship", "todo")] };
    const next = boardReducer(state, cardMoved({ id: "nope", toColumnId: "doing" }));
    expect(next.cards).toEqual([card("1", "Ship", "todo")]);
  });
});

describe("filtersSlice reducer", () => {
  it("updates query and column filter", () => {
    const afterQuery = filtersReducer(undefined, queryChanged("ship"));
    expect(afterQuery.query).toBe("ship");

    const afterColumn = filtersReducer(afterQuery, columnFilterSet("doing"));
    expect(afterColumn).toEqual({ query: "ship", columnId: "doing" });
  });
});

describe("selectVisibleCards", () => {
  const base: RootState = {
    board: { cards: [card("1", "Ship it", "todo"), card("2", "Review PR", "doing")] },
    filters: { query: "", columnId: null },
  };

  it("filters by column and case-insensitive query together", () => {
    const state: RootState = { ...base, filters: { query: "SHIP", columnId: "todo" } };
    expect(selectVisibleCards(state)).toEqual([card("1", "Ship it", "todo")]);
  });

  it("returns everything when the filters are empty", () => {
    expect(selectVisibleCards(base)).toEqual(base.board.cards);
  });

  it("is memoized: same state in → same array reference out", () => {
    const first = selectVisibleCards(base);
    const second = selectVisibleCards(base);
    expect(second).toBe(first); // a plain filter() would return a fresh array each call
  });
});
