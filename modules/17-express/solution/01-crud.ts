/**
 * Task 1 — Express CRUD (WORKED EXAMPLE).
 *
 * `/cards` is the fully-solved reference: an Express app whose routes cover the whole CRUD
 * lifecycle with correct status codes. `/lists` is the analog — the SAME shape at a different
 * resource — so building it is pure pattern reuse.
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
 * The analog: `/lists` mirrors `/cards` route-for-route, status-for-status. (In `src/` this is a
 * throwing stub — the "your turn" of this worked example.)
 */
export function createListsApp({ repo, idgen }: ListsAppDeps): Express {
  const app = express();
  app.use(express.json());

  app.get("/lists", (_req: Request, res: Response) => {
    res.status(200).json(repo.list());
  });

  app.get("/lists/:id", (req: Request<{ id: string }>, res: Response) => {
    const list = repo.get(req.params.id);
    if (list === undefined) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.status(200).json(list);
  });

  app.post("/lists", (req: Request, res: Response) => {
    const title = (req.body as { title?: unknown }).title;
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const list = repo.create({ id: idgen(), title });
    res.status(201).location(`/lists/${list.id}`).json(list);
  });

  const update = (req: Request<{ id: string }>, res: Response): void => {
    const title = (req.body as { title?: unknown }).title;
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const list = repo.update(req.params.id, { title });
    if (list === undefined) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.status(200).json(list);
  };
  app.put("/lists/:id", update);
  app.patch("/lists/:id", update);

  app.delete("/lists/:id", (req: Request<{ id: string }>, res: Response) => {
    const removed = repo.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.status(204).end();
  });

  return app;
}
