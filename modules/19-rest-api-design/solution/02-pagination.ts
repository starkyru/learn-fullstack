/**
 * Cursor (keyset) pagination + filtering + sorting for `GET /v1/boards/:boardId/cards`.
 *
 * The cursor is base64url of the last row's stable sort key (`{ field, value, id }`). Paging asks
 * for rows strictly _after_ that key in the active sort order, so a row inserted _before_ the cursor
 * position never shifts the page — no skips, no duplicates (unlike LIMIT/OFFSET). `(sortValue, id)`
 * is a total order, which is what keeps the cursor stable across inserts.
 */
import express from "express";
import type { Express, Response } from "express";
import { z } from "zod";

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
  /** Seed cards. Defaults to `DEFAULT_CARDS`. */
  cards?: readonly Card[];
}

type SortField = "createdAt" | "title";
interface SortSpec {
  field: SortField;
  dir: 1 | -1;
}
interface CursorPayload {
  field: SortField;
  value: string;
  id: string;
}

const DEFAULT_CARDS: readonly Card[] = [
  {
    id: "c1",
    boardId: "b1",
    title: "Delta",
    status: "todo",
    createdAt: "2020-01-01T00:00:01.000Z",
  },
  {
    id: "c2",
    boardId: "b1",
    title: "Alpha",
    status: "done",
    createdAt: "2020-01-01T00:00:02.000Z",
  },
  {
    id: "c3",
    boardId: "b1",
    title: "Echo",
    status: "todo",
    createdAt: "2020-01-01T00:00:03.000Z",
  },
  {
    id: "c4",
    boardId: "b1",
    title: "Bravo",
    status: "done",
    createdAt: "2020-01-01T00:00:04.000Z",
  },
  {
    id: "c5",
    boardId: "b1",
    title: "Charlie",
    status: "todo",
    createdAt: "2020-01-01T00:00:05.000Z",
  },
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function counterIds(prefix: string): () => string {
  let n = 0;
  return () => `${prefix}${++n}`;
}

function firstStr(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const head = v[0];
    if (typeof head === "string") return head;
  }
  return undefined;
}

function clampLimit(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function parseSort(raw: string | undefined): SortSpec {
  if (!raw) return { field: "createdAt", dir: 1 };
  const dir: 1 | -1 = raw.startsWith("-") ? -1 : 1;
  const name = raw.startsWith("-") ? raw.slice(1) : raw;
  const field: SortField = name === "title" ? "title" : "createdAt";
  return { field, dir };
}

function fieldValue(c: Card, f: SortField): string {
  return f === "title" ? c.title : c.createdAt;
}

/** Total order: primary `field` in `dir`, tie-broken by `id` ascending. */
function compare(a: Card, b: Card, spec: SortSpec): number {
  const av = fieldValue(a, spec.field);
  const bv = fieldValue(b, spec.field);
  if (av < bv) return -1 * spec.dir;
  if (av > bv) return 1 * spec.dir;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/** True when `c` sorts strictly after the cursor position in the active order. */
function isAfterCursor(c: Card, cursor: CursorPayload, spec: SortSpec): boolean {
  const cv = fieldValue(c, spec.field);
  if (cv > cursor.value) return spec.dir === 1;
  if (cv < cursor.value) return spec.dir === -1;
  return c.id > cursor.id;
}

function encodeCursor(p: CursorPayload): string {
  return Buffer.from(JSON.stringify(p), "utf8").toString("base64url");
}

function decodeCursor(raw: string): CursorPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      if (
        (p.field === "createdAt" || p.field === "title") &&
        typeof p.value === "string" &&
        typeof p.id === "string"
      ) {
        return { field: p.field, value: p.value, id: p.id };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function sendProblem(
  res: Response,
  p: { status: number; title: string; detail: string; instance: string },
): void {
  res.status(p.status).type("application/problem+json").json({
    type: "about:blank",
    title: p.title,
    status: p.status,
    detail: p.detail,
    instance: p.instance,
  });
}

const createCardSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  createdAt: z.string().optional(),
});

export function createApi(deps: PaginationDeps = {}): Express {
  const now = deps.now ?? (() => "2020-01-01T00:00:10.000Z");
  const generateId = deps.generateId ?? counterIds("gen_");
  const boards = new Set<string>(deps.boards ?? ["b1", "b2"]);
  const cards: Card[] = [...(deps.cards ?? DEFAULT_CARDS)];

  const app = express();
  app.use(express.json());

  const v1 = express.Router();

  v1.get("/boards/:boardId/cards", (req, res) => {
    const boardId = req.params.boardId;
    if (!boardId || !boards.has(boardId)) {
      return sendProblem(res, {
        status: 404,
        title: "Board Not Found",
        detail: `No board exists with id '${boardId ?? ""}'.`,
        instance: req.originalUrl,
      });
    }

    const spec = parseSort(firstStr(req.query.sort));
    const statusFilter = firstStr(req.query.status);
    const limit = clampLimit(firstStr(req.query.limit));
    const cursorRaw = firstStr(req.query.cursor);

    let rows = cards.filter((c) => c.boardId === boardId);
    if (statusFilter !== undefined) rows = rows.filter((c) => c.status === statusFilter);
    rows = rows.slice().sort((a, b) => compare(a, b, spec));

    if (cursorRaw !== undefined) {
      const cursor = decodeCursor(cursorRaw);
      if (cursor) rows = rows.filter((c) => isAfterCursor(c, cursor, spec));
    }

    const pageItems = rows.slice(0, limit);
    let nextCursor: string | null = null;
    if (rows.length > limit && pageItems.length > 0) {
      const last = pageItems[pageItems.length - 1];
      if (last)
        nextCursor = encodeCursor({
          field: spec.field,
          value: fieldValue(last, spec.field),
          id: last.id,
        });
    }

    const page: Page<Card> = { data: pageItems, nextCursor };
    res.status(200).json(page);
  });

  v1.post("/boards/:boardId/cards", (req, res) => {
    const boardId = req.params.boardId;
    if (!boardId || !boards.has(boardId)) {
      return sendProblem(res, {
        status: 404,
        title: "Board Not Found",
        detail: `No board exists with id '${boardId ?? ""}'.`,
        instance: req.originalUrl,
      });
    }
    const parsed = createCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendProblem(res, {
        status: 400,
        title: "Invalid Card",
        detail: parsed.error.issues
          .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
          .join("; "),
        instance: req.originalUrl,
      });
    }
    const card: Card = {
      id: generateId(),
      boardId,
      title: parsed.data.title,
      status: parsed.data.status,
      createdAt: parsed.data.createdAt ?? now(),
    };
    cards.push(card);
    res.status(201).location(`/v1/boards/${boardId}/cards/${card.id}`).json(card);
  });

  v1.get("/boards/:boardId/cards/:cardId", (req, res) => {
    const boardId = req.params.boardId;
    const cardId = req.params.cardId;
    if (!boardId || !boards.has(boardId)) {
      return sendProblem(res, {
        status: 404,
        title: "Board Not Found",
        detail: `No board exists with id '${boardId ?? ""}'.`,
        instance: req.originalUrl,
      });
    }
    const card = cards.find((c) => c.boardId === boardId && c.id === cardId);
    if (!card) {
      return sendProblem(res, {
        status: 404,
        title: "Card Not Found",
        detail: `No card exists with id '${cardId ?? ""}' on board '${boardId}'.`,
        instance: req.originalUrl,
      });
    }
    res.status(200).json(card);
  });

  app.use("/v1", v1);
  return app;
}
