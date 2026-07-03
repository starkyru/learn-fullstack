/**
 * Resource design — nested REST resources under a `/v1` version prefix, with correct status codes
 * and RFC 7807 `application/problem+json` errors. `createApi()` returns an in-process Express app
 * you can drive with supertest (no network, no DB).
 *
 * WORKED EXAMPLE: `/boards/:boardId/cards` is solved below — study how it:
 *   - `404`s an unknown board with a problem+json body,
 *   - `GET`s the collection as `200 { data }`,
 *   - `POST`s a `201` with a `Location` header and a `400` problem for a bad body.
 *
 * YOUR TURN (analog): mirror all of that for `/boards/:boardId/lists` (a list has `{ name }` instead
 * of `{ title, status }`). Its two handlers `throw` — replace each with the list equivalent.
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

export interface List {
  id: string;
  boardId: string;
  name: string;
  createdAt: string;
}

/** RFC 7807 problem detail. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export interface ApiDeps {
  /** Deterministic clock — returns the `createdAt` ISO string for newly created rows. */
  now?: () => string;
  /** Deterministic id generator for newly created rows. */
  generateId?: () => string;
  /** Known board ids. Defaults to `["b1", "b2"]`. */
  boards?: readonly string[];
  /** Seed cards. Defaults to `DEFAULT_CARDS`. */
  cards?: readonly Card[];
  /** Seed lists. Defaults to `DEFAULT_LISTS`. */
  lists?: readonly List[];
}

const DEFAULT_CARDS: readonly Card[] = [
  {
    id: "c1",
    boardId: "b1",
    title: "Set up repo",
    status: "done",
    createdAt: "2020-01-01T00:00:01.000Z",
  },
  {
    id: "c2",
    boardId: "b1",
    title: "Write tests",
    status: "todo",
    createdAt: "2020-01-01T00:00:02.000Z",
  },
  {
    id: "c3",
    boardId: "b1",
    title: "Ship it",
    status: "doing",
    createdAt: "2020-01-01T00:00:03.000Z",
  },
];

const DEFAULT_LISTS: readonly List[] = [
  { id: "l1", boardId: "b1", name: "Backlog", createdAt: "2020-01-01T00:00:01.000Z" },
];

function counterIds(prefix: string): () => string {
  let n = 0;
  return () => `${prefix}${++n}`;
}

/** Write an RFC 7807 problem document with the correct media type. */
function sendProblem(
  res: Response,
  p: { status: number; title: string; detail: string; instance: string; type?: string },
): void {
  const body: Problem = {
    type: p.type ?? "about:blank",
    title: p.title,
    status: p.status,
    detail: p.detail,
    instance: p.instance,
  };
  res.status(p.status).type("application/problem+json").json(body);
}

const createCardSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
});

export function createApi(deps: ApiDeps = {}): Express {
  const now = deps.now ?? (() => "2020-01-01T00:00:00.000Z");
  const generateId = deps.generateId ?? counterIds("id_");
  const boards = new Set<string>(deps.boards ?? ["b1", "b2"]);
  const cards: Card[] = [...(deps.cards ?? DEFAULT_CARDS)];
  const lists: List[] = [...(deps.lists ?? DEFAULT_LISTS)];

  const app = express();
  app.use(express.json());

  const v1 = express.Router();

  // ---- cards (worked example) --------------------------------------------------------------
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
    const data = cards.filter((c) => c.boardId === boardId);
    res.status(200).json({ data });
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
      createdAt: now(),
    };
    cards.push(card);
    res.status(201).location(`/v1/boards/${boardId}/cards/${card.id}`).json(card);
  });

  // ---- lists (analog of cards) — YOUR TURN -------------------------------------------------
  v1.get("/boards/:boardId/lists", (_req, _res) => {
    // 1) 404 (problem+json) if the board is unknown, like the cards GET above.
    // 2) otherwise respond 200 with `{ data }` filtered to this board's lists (`lists` closure).
    throw new Error("TODO: implement GET /boards/:boardId/lists (mirror the cards GET)");
  });

  v1.post("/boards/:boardId/lists", (_req, _res) => {
    // 1) 404 (problem+json) if the board is unknown.
    // 2) validate the body requires a non-empty `name` (400 problem+json titled "Invalid List").
    // 3) create `{ id: generateId(), boardId, name, createdAt: now() }`, push it, and respond
    //    201 with a `Location: /v1/boards/:boardId/lists/:id` header and the new list as JSON.
    throw new Error(
      "TODO: implement POST /boards/:boardId/lists (mirror the cards POST)",
    );
  });

  app.use("/v1", v1);
  return app;
}
