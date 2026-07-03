import { z } from "zod";

export interface Card {
  id: string;
  title: string;
}

/** The data boundary the handlers depend on — injected so tests use a fake. */
export interface CardsRepo {
  list(): Card[];
  add(card: Card): void;
}

/** A trivial in-memory repo (seedable) for the handlers and for tests. */
export function createInMemoryRepo(seed: Card[] = []): CardsRepo {
  const cards: Card[] = [...seed];
  return {
    list: () => [...cards],
    add: (card) => {
      cards.push(card);
    },
  };
}

// Keep zod imported — you'll validate the POST body with it.
void z;

/**
 * YOUR TURN — build the route handlers and the auth middleware.
 *
 * 1. `makeCardsHandlers(repo, nextId)` returns `{ GET, POST }`, each
 *    `(req: Request) => Promise<Response>`:
 *      - GET  → `200` with JSON `{ cards: repo.list() }`.
 *      - POST → read `await req.json()` (guard against invalid JSON), validate
 *        with `z.object({ title: z.string().min(1) })`. On failure return `400`
 *        `{ error: "invalid card" }`. On success build `{ id: nextId(), title }`,
 *        `repo.add(card)`, and return `201` `{ card }`. Set
 *        `content-type: application/json` on every response. Use `nextId()` for the
 *        id — never `Math.random`/`Date.now`.
 *
 * 2. `middleware(req)` gates the request: if `pathname === "/login"` or a
 *    `session` cookie exists, return `undefined`. Otherwise return a `307`
 *    redirect `Response` with `Location` set to `/login` on `req.nextUrl.origin`.
 */
export function makeCardsHandlers(
  _repo: CardsRepo,
  _nextId: () => string,
): {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
} {
  throw new Error("TODO: web-standard GET/POST handlers for /api/cards");
}

/** The minimal shape of the request that `middleware` reads. */
export interface NextRequestLike {
  nextUrl: { origin: string; pathname: string };
  cookies: { get(name: string): { value: string } | undefined };
}

export function middleware(_req: NextRequestLike): Response | undefined {
  throw new Error("TODO: 307 redirect unauthenticated requests to /login");
}
