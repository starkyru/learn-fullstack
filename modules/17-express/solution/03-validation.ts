/**
 * Task 3 — Validation (zod body validation middleware).
 *
 * `validateBody(schema)` is generic middleware: it `safeParse`s `req.body`, responds
 * `400 { error: "ValidationError", issues: [...] }` (each issue = `{ path, message }` straight from
 * zod) on failure, and on success replaces `req.body` with the PARSED, typed value before `next()`.
 * A single schema then guards every route — the handler trusts `req.body` is valid.
 */
import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { z, type ZodType } from "zod";
import {
  createMemoryRepo,
  seqIdGen,
  type Card,
  type IdGen,
  type Repo,
} from "./01-crud.js";

/** The shape a valid create-card body must satisfy. `min(3)` drives the "too short" 400. */
export const createCardSchema = z.object({
  title: z.string().min(3),
});

export type CreateCardBody = z.infer<typeof createCardSchema>;

/** One normalized validation issue returned to the client. */
export interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

/**
 * Middleware factory: validate `req.body` against `schema`.
 * Failure → 400 with the zod issues; success → attach parsed body and continue.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, res: Response, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
        path: [...issue.path],
        message: issue.message,
      }));
      res.status(400).json({ error: "ValidationError", issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

export interface ValidatedCardsAppDeps {
  repo?: Repo<Card>;
  idgen?: IdGen;
}

/**
 * A `POST /cards` guarded by `validateBody(createCardSchema)`:
 *   - invalid body → 400 with the exact zod issue (path + message).
 *   - valid body → 201 + `Location`, and the handler safely reads `req.body.title`.
 */
export function createValidatedCardsApp(deps: ValidatedCardsAppDeps = {}): Express {
  const repo = deps.repo ?? createMemoryRepo<Card>();
  const idgen = deps.idgen ?? seqIdGen("card");

  const app = express();
  app.use(express.json());

  app.post("/cards", validateBody(createCardSchema), (req: Request, res: Response) => {
    const body = req.body as CreateCardBody;
    const card = repo.create({ id: idgen(), title: body.title });
    res.status(201).location(`/cards/${card.id}`).json(card);
  });

  return app;
}
