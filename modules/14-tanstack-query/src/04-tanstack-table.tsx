import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useState } from "react";
import type { ReactElement } from "react";

/**
 * Task 4 — Headless sortable table (WORKED EXAMPLE).
 *
 * `UsersTable` is solved: study how `getSortedRowModel` + a `sorting` state + per-header
 * `getToggleSortingHandler()` produce click-to-sort with markup you own.
 */

export interface User {
  id: string;
  name: string;
  age: number;
}

const userHelper = createColumnHelper<User>();
const userColumns = [
  userHelper.accessor("name", { header: "Name" }),
  // Number columns default to `sortDescFirst`; force asc-first so one click gives ascending order.
  userHelper.accessor("age", { header: "Age", sortDescFirst: false }),
];

/** Reference: a sortable users table. */
export function UsersTable({ users }: { users: User[] }): ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: users,
    columns: userColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((header) => (
              <th key={header.id}>
                <button type="button" onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </button>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface CardRow {
  id: string;
  title: string;
  priority: number;
}

/**
 * YOUR TURN — build the SAME sortable table for cards:
 *   - `createColumnHelper<CardRow>()` with accessor columns `title` (header "Title") and
 *     `priority` (header "Priority").
 *   - `useReactTable` with a `sorting` state, `onSortingChange`, `getCoreRowModel`,
 *     `getSortedRowModel`; render header buttons wired to `getToggleSortingHandler()` and one
 *     `<td>` per visible cell (mirror `UsersTable`).
 */
export function CardsTable(_props: { cards: CardRow[] }): ReactElement {
  throw new Error("TODO: mirror UsersTable for CardRow with Title + Priority columns");
}
