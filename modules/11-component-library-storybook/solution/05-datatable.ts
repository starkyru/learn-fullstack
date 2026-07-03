import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * A HEADLESS DataTable: it owns behavior (sort + selection) and returns state + handlers,
 * but renders nothing. The same hook drives a Tailwind table or a CSS-Modules table — the
 * skin is swappable, the logic is not duplicated. That separation is the whole point of the
 * "styling compare" task: identical behavior, two presentations (see docs/STYLING.md).
 */

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface UseDataTableOptions<T> {
  rows: T[];
  /** Stable id per row; defaults to `row.id`. */
  getRowId?: (row: T) => string;
}

export interface DataTable<T> {
  /** Rows in current sort order (original order when unsorted). */
  rows: T[];
  sort: SortState | null;
  /** Click a column: sets it ascending, or flips direction if already active. */
  toggleSort: (key: keyof T & string) => void;
  selectedIds: ReadonlySet<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  /** Select every row, or clear if all are already selected. */
  toggleSelectAll: () => void;
  allSelected: boolean;
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  // null/undefined always sort last — and symmetrically: compare(x, null) === -compare(null, x).
  // Without this, `undefined < 5` and `5 < undefined` are BOTH false, so the fallback would
  // return 1 for both orders, breaking Array.sort's antisymmetry contract.
  if (a == null) return 1;
  if (b == null) return -1;
  // Strings and numbers both order correctly with relational operators here.
  return (a as never) < (b as never) ? -1 : 1;
}

export function useDataTable<T>({
  rows,
  getRowId = (row) => String((row as { id: unknown }).id),
}: UseDataTableOptions<T>): DataTable<T> {
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  // Prune the selection when rows disappear: an id for a row that no longer exists would
  // otherwise linger, inflating `.size` and skewing the `allSelected` math. Returning the same
  // Set reference when nothing was pruned keeps this from looping.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const valid = new Set(rows.map(getRowId));
      const next = new Set<string>();
      let changed = false;
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
    // getRowId is intentionally omitted: prune only when the row set itself changes.
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (sort === null) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    // Copy before sort so we never mutate the caller's array.
    return [...rows].sort(
      (a, b) =>
        dir *
        compare(
          (a as Record<string, unknown>)[sort.key],
          (b as Record<string, unknown>)[sort.key],
        ),
    );
  }, [rows, sort]);

  const toggleSort = useCallback((key: keyof T & string) => {
    setSort((prev) =>
      prev && prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const everySelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      return everySelected ? new Set() : new Set(allIds);
    });
  }, [allIds]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return {
    rows: sortedRows,
    sort,
    toggleSort,
    selectedIds,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    allSelected,
  };
}
