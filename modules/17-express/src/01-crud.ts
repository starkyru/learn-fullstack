/**
 * Task 1 — Express CRUD (WORKED EXAMPLE).
 *
 * `/cards` below is the fully-solved reference: an Express app whose routes cover the whole CRUD
 * lifecycle with correct status codes. Read it, then do YOUR TURN — implement `createListsApp` so
 * `/lists` mirrors `/cards` route-for-route, status-for-status.
 *
 * Everything is injected: an in-memory `Repo` (seeded deterministically in tests) and an `idgen`
 * (a seq counter, never `Date.now()`/`Math.random()`), so the server is fully deterministic and
 * testable in-process with `supertest` — no port, no clock, no DB.
 */
import express, { type Express, type Request, type Response } from "express";

export interface Card {
  id: string;
  title: string;
}

export interface List {
  id: string;
  title: string;
}

/** A minimal in-memory data store. Generic so `/cards` and `/lists` share one implementation. */
export interface Repo<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  create(entity: T): T;
  update(id: string, patch: Partial<Omit<T, "id">>): T | undefined;
  remove(id: string): boolean;
}

/** An injected id generator — a seq counter keeps ids deterministic across a test run. */
export type IdGen = () => string;

/** A seq id generator: `card-1`, `card-2`, … Deterministic, no clock/randomness. */
export function seqIdGen(prefix: string): IdGen {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/** An in-memory `Repo`, optionally seeded. Insertion order is preserved by `Map`. */
export function createMemoryRepo<T extends { id: string }>(
  seed: readonly T[] = [],
): Repo<T> {
  const rows = new Map<string, T>(seed.map((row): [string, T] => [row.id, row]));
  return {
    list: () => [...rows.values()],
    get: (id) => rows.get(id),
    create: (entity) => {
      rows.set(entity.id, entity);
      return entity;
    },
    update: (id, patch) => {
      const existing = rows.get(id);
      if (existing === undefined) return undefined;
      const next = { ...existing, ...patch };
      rows.set(id, next);
      return next;
    },
    remove: (id) => rows.delete(id),
  };
}

export interface CardsAppDeps {
  repo: Repo<Card>;
  idgen: IdGen;
}

/**
 * The reference: an Express app exposing full CRUD over `/cards`.
 * `express.json()` parses the request body onto `req.body` before any handler runs.
 */
export function createCardsApp({ repo, idgen }: CardsAppDeps): Express {
  const app = express();
  app.use(express.json());

  // READ all → 200 + the list.
  app.get("/cards", (_req: Request, res: Response) => {
    res.status(200).json(repo.list());
  });

  // READ one → 200, or 404 when the id is unknown.
  app.get("/cards/:id", (req: Request<{ id: string }>, res: Response) => {
    const card = repo.get(req.params.id);
    if (card === undefined) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.status(200).json(card);
  });

  // CREATE → 201 + a `Location` header pointing at the new resource.
  app.post("/cards", (req: Request, res: Response) => {
    const title = (req.body as { title?: unknown }).title;
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const card = repo.create({ id: idgen(), title });
    res.status(201).location(`/cards/${card.id}`).json(card);
  });

  // FULL/PARTIAL UPDATE → 200 with the updated row, or 404. (PUT and PATCH behave the same here.)
  const update = (req: Request<{ id: string }>, res: Response): void => {
    const title = (req.body as { title?: unknown }).title;
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const card = repo.update(req.params.id, { title });
    if (card === undefined) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.status(200).json(card);
  };
  app.put("/cards/:id", update);
  app.patch("/cards/:id", update);

  // DELETE → 204 (no body) on success, 404 when the id is unknown.
  app.delete("/cards/:id", (req: Request<{ id: string }>, res: Response) => {
    const removed = repo.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.status(204).end();
  });

  return app;
}

export interface ListsAppDeps {
  repo: Repo<List>;
  idgen: IdGen;
}

/**
 * YOUR TURN (analog) — build `/lists` to mirror `/cards` exactly:
 *   1. `express()` + `app.use(express.json())`.
 *   2. GET /lists → 200 + `repo.list()`.
 *   3. GET /lists/:id → 200 the row, or 404 `{ error: "List not found" }`.
 *   4. POST /lists → validate `title` is a non-empty string (else 400); `repo.create({ id: idgen(), title })`;
 *      respond 201 with `.location(\`/lists/${list.id}\`)` and the JSON body.
 *   5. PUT & PATCH /lists/:id → `repo.update`, 200 the row or 404.
 *   6. DELETE /lists/:id → `repo.remove`, 204 (no body) or 404.
 *   7. `return app`.
 */
export function createListsApp(_deps: ListsAppDeps): Express {
  throw new Error(
    "TODO: build the /lists app mirroring createCardsApp (200/201+Location/404/204)",
  );
}
