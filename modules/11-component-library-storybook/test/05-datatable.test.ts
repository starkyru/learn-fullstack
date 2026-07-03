import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDataTable } from "../solution/05-datatable.js";

interface Row {
  id: string;
  name: string;
  age: number;
}

const ROWS: Row[] = [
  { id: "b", name: "Beth", age: 30 },
  { id: "a", name: "Ada", age: 41 },
  { id: "c", name: "Cyd", age: 25 },
];

const names = (rows: Row[]) => rows.map((r) => r.name);

describe("useDataTable — sorting", () => {
  it("returns original order until a column is sorted", () => {
    const { result } = renderHook(() => useDataTable({ rows: ROWS }));
    expect(names(result.current.rows)).toEqual(["Beth", "Ada", "Cyd"]);
    expect(result.current.sort).toBeNull();
  });

  it("sorts ascending, then flips to descending on the same column", () => {
    const { result } = renderHook(() => useDataTable({ rows: ROWS }));

    act(() => result.current.toggleSort("name"));
    expect(result.current.sort).toEqual({ key: "name", dir: "asc" });
    expect(names(result.current.rows)).toEqual(["Ada", "Beth", "Cyd"]);

    act(() => result.current.toggleSort("name"));
    expect(result.current.sort).toEqual({ key: "name", dir: "desc" });
    expect(names(result.current.rows)).toEqual(["Cyd", "Beth", "Ada"]);
  });

  it("switching columns resets to ascending and sorts numerically", () => {
    const { result } = renderHook(() => useDataTable({ rows: ROWS }));
    act(() => result.current.toggleSort("name"));
    act(() => result.current.toggleSort("age"));
    expect(result.current.sort).toEqual({ key: "age", dir: "asc" });
    expect(result.current.rows.map((r) => r.age)).toEqual([25, 30, 41]);
  });

  it("does not mutate the caller's rows array", () => {
    const input = [...ROWS];
    const { result } = renderHook(() => useDataTable({ rows: input }));
    act(() => result.current.toggleSort("name"));
    expect(names(input)).toEqual(["Beth", "Ada", "Cyd"]);
  });

  it("sorts rows with missing values to the end (comparator stays antisymmetric)", () => {
    interface Task {
      id: string;
      due?: number;
    }
    const tasks: Task[] = [
      { id: "a", due: 3 },
      { id: "b" }, // due is undefined
      { id: "c", due: 1 },
    ];
    const { result } = renderHook(() => useDataTable({ rows: tasks }));
    act(() => result.current.toggleSort("due"));
    // 1, 3, then the undefined row last — deterministic, not order-dependent.
    expect(result.current.rows.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("useDataTable — selection", () => {
  it("toggles a single row on and off", () => {
    const { result } = renderHook(() => useDataTable({ rows: ROWS }));

    act(() => result.current.toggleSelect("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect([...result.current.selectedIds]).toEqual(["a"]);
    expect(result.current.allSelected).toBe(false);

    act(() => result.current.toggleSelect("a"));
    expect(result.current.isSelected("a")).toBe(false);
  });

  it("select-all selects every row, then clears when all are selected", () => {
    const { result } = renderHook(() => useDataTable({ rows: ROWS }));

    act(() => result.current.toggleSelectAll());
    expect(result.current.allSelected).toBe(true);
    expect([...result.current.selectedIds].sort()).toEqual(["a", "b", "c"]);

    act(() => result.current.toggleSelectAll());
    expect(result.current.allSelected).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("drops a selected id when its row is removed from the input", () => {
    const { result, rerender } = renderHook(({ rows }) => useDataTable({ rows }), {
      initialProps: { rows: ROWS },
    });

    act(() => result.current.toggleSelect("a"));
    act(() => result.current.toggleSelect("b"));
    expect(result.current.selectedIds.size).toBe(2);

    // Row "a" leaves the dataset — its selection must not linger.
    rerender({ rows: ROWS.filter((r) => r.id !== "a") });

    expect(result.current.isSelected("a")).toBe(false);
    expect([...result.current.selectedIds]).toEqual(["b"]);
  });
});
