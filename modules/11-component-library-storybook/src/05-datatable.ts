import { useState } from "react";

/**
 * A HEADLESS DataTable: it owns behavior (sort + selection) and returns state + handlers,
 * but renders nothing. The same hook drives a Tailwind table or a CSS-Modules table.
 *
 * YOUR TURN — implement `useDataTable`:
 *   - `rows`: the input rows in current sort order (original order when `sort` is null).
 *   - `toggleSort(key)`: set `{ key, dir: "asc" }`, or flip `dir` if `key` is already active.
 *     Sort a COPY (`[...rows].sort`) — never mutate the caller's array. A `<`-based comparator
 *     orders both strings and numbers, but handle `null`/`undefined` FIRST (sort them last:
 *     `if (a == null) return 1; if (b == null) return -1;`) — otherwise `undefined < x` and
 *     `x < undefined` are both false and the comparator breaks `Array.sort`'s antisymmetry.
 *   - selection: hold a `Set<string>` of row ids (`getRowId`, default `row.id`).
 *     `toggleSelect(id)` adds/removes; `toggleSelectAll()` selects all or clears if all are
 *     already selected; `allSelected` is true only when every row id is in the set.
 *   Keep state immutable: build a NEW Set on every change so React re-renders.
 *   Stretch: when `rows` changes, prune ids for rows that no longer exist (a `useEffect([rows])`
 *   that intersects the set with the current ids) so a removed row's selection can't linger.
 */

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface UseDataTableOptions<T> {
  rows: T[];
  getRowId?: (row: T) => string;
}

export interface DataTable<T> {
  rows: T[];
  sort: SortState | null;
  toggleSort: (key: keyof T & string) => void;
  selectedIds: ReadonlySet<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  allSelected: boolean;
}

export function useDataTable<T>(_options: UseDataTableOptions<T>): DataTable<T> {
  void useState;
  throw new Error("TODO: headless sort + row-selection state");
}
