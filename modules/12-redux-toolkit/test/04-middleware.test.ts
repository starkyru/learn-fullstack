import { describe, expect, it } from "vitest";
import type { Card } from "../solution/01-slices.js";
import {
  cardAdded,
  cardRemoved,
  makeUndoableStore,
  undo,
} from "../solution/04-middleware.js";

const card = (id: string, title: string): Card => ({ id, title, columnId: "todo" });
const ids = (store: ReturnType<typeof makeUndoableStore>) =>
  store.getState().board.cards.map((c) => c.id);

describe("undo middleware", () => {
  it("reverts the most recent mutation, one step at a time", () => {
    const store = makeUndoableStore();

    store.dispatch(cardAdded(card("a", "A")));
    store.dispatch(cardAdded(card("b", "B")));
    expect(ids(store)).toEqual(["a", "b"]);

    store.dispatch(undo());
    expect(ids(store)).toEqual(["a"]); // B's add reverted

    store.dispatch(undo());
    expect(ids(store)).toEqual([]); // A's add reverted
  });

  it("reverts a removal by restoring the removed card", () => {
    const store = makeUndoableStore();
    store.dispatch(cardAdded(card("a", "A")));
    store.dispatch(cardAdded(card("b", "B")));

    store.dispatch(cardRemoved("a"));
    expect(ids(store)).toEqual(["b"]);

    store.dispatch(undo());
    expect(ids(store)).toEqual(["a", "b"]); // the removal is undone
  });

  it("is a no-op when the history is empty", () => {
    const store = makeUndoableStore();
    store.dispatch(undo());
    expect(ids(store)).toEqual([]);

    store.dispatch(cardAdded(card("a", "A")));
    store.dispatch(undo()); // back to empty
    store.dispatch(undo()); // extra undo does nothing, no throw
    expect(ids(store)).toEqual([]);
  });
});
