/**
 * Cursor (keyset) pagination + filtering + sorting for `GET /v1/boards/:boardId/cards`.
 *
 * YOUR TURN — implement `createApi(deps)` so the returned Express app:
 *   1) 404s (problem+json) an unknown board; otherwise handles
 *      `GET /v1/boards/:boardId/cards?limit=&cursor=&sort=&filter`.
 *   2) FILTER: `?status=done` keeps only rows with that status.
 *   3) SORT: `?sort=title` (asc) / `?sort=-createdAt` (desc). Build a TOTAL order — primary field in
 *      the requested direction, then tie-break by `id` ascending — so paging is deterministic.
 *   4) CURSOR: encode the LAST returned row's stable key as base64url of `{ field, value, id }`.
 *      A page returns the first `limit` rows sorted; `nextCursor` is set only when more rows remain.
 *      A follow-up request with `?cursor=` returns rows STRICTLY AFTER that key in the sort order —
 *      so a row inserted before the cursor position never duplicates or skips (keyset, not offset).
 *   5) Also expose `POST /v1/boards/:boardId/cards` (accepts `{ title, status?, createdAt? }`, 201 +
 *      Location) and `GET /v1/boards/:boardId/cards/:cardId` (200 or 404 problem+json).
 *
 * Determinism: default the clock/id from `deps` so `createdAt`/`id` are fixed in tests.
 */
import type { Express } from "express";

export type CardStatus = "todo" | "doing" | "done";

export interface Card {
  id: string;
  boardId: string;
  title: string;
  status: CardStatus;
  createdAt: string;
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

export interface PaginationDeps {
  /** Deterministic clock for newly created rows (used when a POST omits `createdAt`). */
  now?: () => string;
  /** Deterministic id generator for newly created rows. */
  generateId?: () => string;
  /** Known board ids. Defaults to `["b1", "b2"]`. */
  boards?: readonly string[];
  /** Seed cards. */
  cards?: readonly Card[];
}

export function createApi(_deps: PaginationDeps = {}): Express {
  throw new Error(
    "TODO: build the cursor-paginated cards API (limit/cursor/sort/filter, stable keyset cursor)",
  );
}
