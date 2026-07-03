import { describe, expect, it } from "vitest";
import {
  reduce,
  visibleKeys,
  type Item,
  type ListState,
} from "../solution/03-reorder.js";

const items: Item[] = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];
const initial: ListState = { items, exiting: [] };

describe("AnimatePresence exit/reorder reducer", () => {
  it("remove drops the item from items but keeps its key EXITING (visible before unmount)", () => {
    const next = reduce(initial, { type: "remove", id: "b" });
    expect(next).toEqual({
      items: [
        { id: "a", label: "A" },
        { id: "c", label: "C" },
      ],
      exiting: ["b"],
    });
    // Exit fires before unmount: "b" is still in the visible set.
    expect(visibleKeys(next)).toEqual(["a", "c", "b"]);
  });

  it("exited unmounts the key: it leaves the exiting set and the visible set", () => {
    const removed = reduce(initial, { type: "remove", id: "b" });
    const done = reduce(removed, { type: "exited", id: "b" });
    expect(done.exiting).toEqual([]);
    expect(visibleKeys(done)).toEqual(["a", "c"]);
  });

  it("remove of an unknown id is a no-op (same state reference)", () => {
    expect(reduce(initial, { type: "remove", id: "z" })).toBe(initial);
  });

  it("a double remove is ignored — the key is already exiting", () => {
    const once = reduce(initial, { type: "remove", id: "b" });
    expect(reduce(once, { type: "remove", id: "b" })).toBe(once);
  });

  it("reorder moves an item immutably to the target index", () => {
    const next = reduce(initial, { type: "reorder", from: 0, to: 2 });
    expect(next.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(initial.items.map((i) => i.id)).toEqual(["a", "b", "c"]); // original untouched
  });

  it("reorder with an out-of-range index is a no-op", () => {
    expect(reduce(initial, { type: "reorder", from: 5, to: 0 })).toBe(initial);
  });

  it("reorder with a valid from but out-of-range to is a no-op (target index guarded)", () => {
    // from:0 is a real item, but to:3 is past the end of a 3-item list.
    expect(reduce(initial, { type: "reorder", from: 0, to: 3 })).toBe(initial);
  });
});
