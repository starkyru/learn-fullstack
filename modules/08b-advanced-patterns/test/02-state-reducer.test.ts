import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useSelect,
  type SelectActionWithChanges,
  type SelectState,
} from "../solution/02-state-reducer.js";

const items = ["apple", "banana", "cherry"];

describe("useSelect default transitions", () => {
  it("open / close drive isOpen and reset the highlight", () => {
    const { result } = renderHook(() => useSelect({ items }));
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.highlight(1));
    expect(result.current.highlightedIndex).toBe(1);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.highlightedIndex).toBe(-1); // close clears the highlight
  });

  it("selecting an item records it, sets the index, and closes by default", () => {
    const { result } = renderHook(() => useSelect({ items }));
    act(() => result.current.open());
    act(() => result.current.selectItem("banana", 1));

    expect(result.current.selectedItem).toBe("banana");
    expect(result.current.highlightedIndex).toBe(1);
    expect(result.current.isOpen).toBe(false); // closeOnSelect defaults to true
  });

  it("closeOnSelect:false keeps the menu open after a select, while the default closes it", () => {
    const kept = renderHook(() => useSelect({ items, closeOnSelect: false }));
    act(() => kept.result.current.open());
    act(() => kept.result.current.selectItem("banana", 1));
    expect(kept.result.current.selectedItem).toBe("banana"); // selection still recorded
    expect(kept.result.current.highlightedIndex).toBe(1);
    expect(kept.result.current.isOpen).toBe(true); // stays open

    const closed = renderHook(() => useSelect({ items, closeOnSelect: true }));
    act(() => closed.result.current.open());
    act(() => closed.result.current.selectItem("banana", 1));
    expect(closed.result.current.isOpen).toBe(false); // default closes
  });

  it("highlight clamps to the upper bound and rejects negatives", () => {
    const { result } = renderHook(() => useSelect({ items })); // 3 items

    act(() => result.current.highlight(99));
    expect(result.current.highlightedIndex).toBe(2); // clamped to length - 1

    act(() => result.current.highlight(-5));
    expect(result.current.highlightedIndex).toBe(-1); // negatives map to "nothing highlighted"
  });

  it("moveHighlight wraps around the list in both directions", () => {
    const { result } = renderHook(() => useSelect({ items }));
    act(() => result.current.open());

    act(() => result.current.moveHighlight(1)); // -1 -> 0
    expect(result.current.highlightedIndex).toBe(0);

    act(() => result.current.moveHighlight(-1)); // 0 -> 2 (wrap past the start)
    expect(result.current.highlightedIndex).toBe(2);

    act(() => result.current.moveHighlight(1)); // 2 -> 0 (wrap past the end)
    expect(result.current.highlightedIndex).toBe(0);
  });
});

describe("useSelect stateReducer override", () => {
  it("lets the consumer veto the auto-close on select (menu stays open)", () => {
    const stateReducer = (
      _state: SelectState,
      action: SelectActionWithChanges,
    ): SelectState =>
      action.type === "select" ? { ...action.changes, isOpen: true } : action.changes;

    const { result } = renderHook(() => useSelect({ items, stateReducer }));
    act(() => result.current.open());
    act(() => result.current.selectItem("cherry", 2));

    expect(result.current.selectedItem).toBe("cherry"); // selection still recorded
    expect(result.current.highlightedIndex).toBe(2);
    expect(result.current.isOpen).toBe(true); // the veto held the menu open
  });

  it("lets the consumer override the next highlighted index", () => {
    const stateReducer = (
      _state: SelectState,
      action: SelectActionWithChanges,
    ): SelectState =>
      action.type === "highlight"
        ? { ...action.changes, highlightedIndex: 0 }
        : action.changes;

    const { result } = renderHook(() => useSelect({ items, stateReducer }));
    act(() => result.current.highlight(2));

    // The default reducer would have committed index 2; the consumer forced it to 0.
    expect(result.current.highlightedIndex).toBe(0);
  });

  it("passes the exact proposed `changes` to the consumer and commits them when returned as-is", () => {
    const seen: SelectState[] = [];
    const stateReducer = (
      _state: SelectState,
      action: SelectActionWithChanges,
    ): SelectState => {
      seen.push(action.changes);
      return action.changes;
    };

    const { result } = renderHook(() => useSelect({ items, stateReducer }));
    act(() => result.current.open());

    expect(seen).toEqual([{ isOpen: true, highlightedIndex: -1, selectedItem: null }]);
    expect(result.current.isOpen).toBe(true);
  });
});
