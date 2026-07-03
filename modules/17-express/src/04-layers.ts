/**
 * Task 4 — Refactor toward modules (EXT).
 *
 * The same CRUD, split into the three layers Nest formalizes:
 *   - `cardRepo`     — DATA: dumb storage, no rules (here, in-memory).
 *   - `cardService`  — BUSINESS RULES: e.g. reject a duplicate title (→ 409). Knows nothing of HTTP.
 *   - `cardRouter`   — HTTP: parse the request, call the service, shape the response. Knows no rules.
 *
 * A synchronous `throw` from the service is caught by Express and forwarded to the error
 * middleware, which maps a `ServiceError { status }` to that status. This repo→service→router seam
 * is exactly what Nest's providers + controllers give you with DI; here it is wired by hand.
 *
 * EXT: this file ships complete — read the split, then extend it (add a rule, a route, a layer).
 */
import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
  type Response,
  type Router,
} from "express";

export interface Card {
  id: string;
  title: string;
}

export type IdGen = () => string;

export function seqIdGen(prefix: string): IdGen {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/** A domain error carrying an HTTP status — thrown by the service, mapped by the error middleware. */
export class ServiceError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

// ── DATA LAYER ────────────────────────────────────────────────────────────────
export interface CardRepo {
  list(): Card[];
  findByTitle(title: string): Card | undefined;
  insert(card: Card): Card;
}

export function createCardRepo(seed: readonly Card[] = []): CardRepo {
  const rows = new Map<string, Card>(seed.map((row): [string, Card] => [row.id, row]));
  return {
    list: () => [...rows.values()],
    findByTitle: (title) => [...rows.values()].find((row) => row.title === title),
    insert: (card) => {
      rows.set(card.id, card);
      return card;
    },
  };
}

// ── SERVICE LAYER (business rules) ──────────────────────────────────────────────
export interface CardService {
  list(): Card[];
  create(input: { title: string }): Card;
}

export interface CardServiceDeps {
  repo: CardRepo;
  idgen: IdGen;
}

export function createCardService({ repo, idgen }: CardServiceDeps): CardService {
  return {
    list: () => repo.list(),
    create: ({ title }) => {
      if (typeof title !== "string" || title.length === 0) {
        throw new ServiceError(400, "title is required");
      }
      // Business rule: titles are unique.
      if (repo.findByTitle(title) !== undefined) {
        throw new ServiceError(409, "A card with that title already exists");
      }
      return repo.insert({ id: idgen(), title });
    },
  };
}

// ── HTTP LAYER ───────────────────────────────────────────────────────────────
export function createCardRouter(service: CardService): Router {
  const router = express.Router();

  router.get("/", (_req: Request, res: Response) => {
    res.status(200).json(service.list());
  });

  router.post("/", (req: Request, res: Response) => {
    // A synchronous throw here is caught by Express → the error middleware maps it.
    const card = service.create({ title: (req.body as { title?: string }).title ?? "" });
    res.status(201).location(`/cards/${card.id}`).json(card);
  });

  return router;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ServiceError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
};

export interface LayeredAppDeps {
  repo: CardRepo;
  idgen: IdGen;
}

/** Wire the three layers into one app: json → router (mounted at /cards) → error middleware. */
export function createLayeredApp({ repo, idgen }: LayeredAppDeps): Express {
  const service = createCardService({ repo, idgen });
  const app = express();
  app.use(express.json());
  app.use("/cards", createCardRouter(service));
  app.use(errorHandler);
  return app;
}
