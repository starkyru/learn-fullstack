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

const CardInput = z.object({ title: z.string().min(1) });

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Web-standard route handlers for `/api/cards`, built as a factory so the repo
 * and the id generator are injected (no `Math.random` — ids are deterministic in
 * tests). Each handler takes a real `Request` and returns a real `Response`, so a
 * test drives them without a Next server.
 *
 * - `GET`  → `200 { cards }`
 * - `POST` → `201 { card }` on valid input; `400 { error }` on invalid JSON/body.
 */
export function makeCardsHandlers(repo: CardsRepo, nextId: () => string) {
  async function GET(_req: Request): Promise<Response> {
    return json({ cards: repo.list() }, 200);
  }

  async function POST(req: Request): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = CardInput.safeParse(body);
    if (!parsed.success) {
      return json({ error: "invalid card" }, 400);
    }
    const card: Card = { id: nextId(), title: parsed.data.title };
    repo.add(card);
    return json({ card }, 201);
  }

  return { GET, POST };
}

/** The minimal shape of the request that `middleware` reads. */
export interface NextRequestLike {
  nextUrl: { origin: string; pathname: string };
  cookies: { get(name: string): { value: string } | undefined };
}

/**
 * Auth gate that runs before the route. Unauthenticated requests (no `session`
 * cookie) are redirected to `/login` with a `307` — exactly what
 * `NextResponse.redirect` produces. Requests already on `/login`, and
 * authenticated requests, fall through (`undefined` = let it continue).
 */
export function middleware(req: NextRequestLike): Response | undefined {
  if (req.nextUrl.pathname === "/login") return undefined;
  if (req.cookies.get("session")) return undefined;
  const location = new URL("/login", req.nextUrl.origin).toString();
  return new Response(null, { status: 307, headers: { Location: location } });
}
