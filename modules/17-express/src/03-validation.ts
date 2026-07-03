/**
 * Task 3 — Validation (zod body validation middleware).
 *
 * Implement `validateBody(schema)`: parse `req.body`, respond 400 with the zod issues on failure,
 * or attach the parsed body and continue on success. Then wire it into a `POST /cards`.
 */
import { type Express, type RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { type Card, type IdGen, type Repo } from "./01-crud.js";

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
 * YOUR TURN — validate `req.body` against `schema`:
 *   1. Return `(req, res, next) => { … }`.
 *   2. `const result = schema.safeParse(req.body)`.
 *   3. If `!result.success`: map `result.error.issues` to `{ path: [...issue.path], message: issue.message }`,
 *      then `res.status(400).json({ error: "ValidationError", issues })` and return.
 *   4. On success: `req.body = result.data; next();`.
 */
export function validateBody<T>(_schema: ZodType<T>): RequestHandler {
  throw new Error(
    "TODO: safeParse req.body → 400 {error:'ValidationError',issues} on fail, else attach + next()",
  );
}

export interface ValidatedCardsAppDeps {
  repo?: Repo<Card>;
  idgen?: IdGen;
}

/**
 * YOUR TURN — a `POST /cards` guarded by `validateBody(createCardSchema)`:
 *   1. `const repo = deps.repo ?? createMemoryRepo<Card>()`, `const idgen = deps.idgen ?? seqIdGen("card")`.
 *   2. `express()` + `app.use(express.json())`.
 *   3. `app.post("/cards", validateBody(createCardSchema), (req, res) => { … })`:
 *      read `(req.body as CreateCardBody).title`, `repo.create({ id: idgen(), title })`,
 *      respond `201` with `.location(\`/cards/${card.id}\`)` and the JSON body.
 *   4. `return app`.
 */
export function createValidatedCardsApp(_deps: ValidatedCardsAppDeps = {}): Express {
  throw new Error(
    "TODO: POST /cards behind validateBody(createCardSchema) → 201 on valid, 400 on invalid",
  );
}
