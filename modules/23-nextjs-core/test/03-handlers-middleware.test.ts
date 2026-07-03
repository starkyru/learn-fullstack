import { describe, expect, it } from "vitest";
import {
  createInMemoryRepo,
  makeCardsHandlers,
  middleware,
  type Card,
  type NextRequestLike,
} from "../solution/03-handlers-middleware.js";

const seq = () => {
  let n = 0;
  return () => `card-${++n}`;
};

const post = (body: unknown): Request =>
  new Request("http://test.local/api/cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET/POST /api/cards handlers", () => {
  it("GET returns 200 with the current card list", async () => {
    const seed: Card[] = [{ id: "card-0", title: "Seed" }];
    const { GET } = makeCardsHandlers(createInMemoryRepo(seed), seq());

    const res = await GET(new Request("http://test.local/api/cards"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      cards: [{ id: "card-0", title: "Seed" }],
    });
  });

  it("POST creates a card with an injected (deterministic) id and returns 201", async () => {
    const repo = createInMemoryRepo();
    const { GET, POST } = makeCardsHandlers(repo, seq());

    const res = await POST(post({ title: "Ship it" }));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      card: { id: "card-1", title: "Ship it" },
    });

    // The write is visible through the repo on the next GET.
    const after = await GET(new Request("http://test.local/api/cards"));
    await expect(after.json()).resolves.toEqual({
      cards: [{ id: "card-1", title: "Ship it" }],
    });
  });

  it("POST rejects an empty title with 400 and does not add anything", async () => {
    const repo = createInMemoryRepo();
    const { GET, POST } = makeCardsHandlers(repo, seq());

    const res = await POST(post({ title: "" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid card" });

    const after = await GET(new Request("http://test.local/api/cards"));
    await expect(after.json()).resolves.toEqual({ cards: [] });
  });

  it("every JSON response sets content-type: application/json", async () => {
    const repo = createInMemoryRepo([{ id: "card-0", title: "Seed" }]);
    const { GET, POST } = makeCardsHandlers(repo, seq());

    const getRes = await GET(new Request("http://test.local/api/cards"));
    expect(getRes.headers.get("content-type")).toBe("application/json");

    const created = await POST(post({ title: "Ship it" }));
    expect(created.status).toBe(201);
    expect(created.headers.get("content-type")).toBe("application/json");

    const rejected = await POST(post({ title: "" }));
    expect(rejected.status).toBe(400);
    expect(rejected.headers.get("content-type")).toBe("application/json");
  });

  it("POST rejects a malformed JSON body with 400", async () => {
    const { POST } = makeCardsHandlers(createInMemoryRepo(), seq());
    const req = new Request("http://test.local/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid card" });
  });
});

describe("auth middleware", () => {
  const req = (opts: { pathname: string; session?: string }): NextRequestLike => ({
    nextUrl: { origin: "https://app.test", pathname: opts.pathname },
    cookies: {
      get: (name) =>
        name === "session" && opts.session !== undefined
          ? { value: opts.session }
          : undefined,
    },
  });

  it("redirects an unauthenticated request to /login with a 307", () => {
    const res = middleware(req({ pathname: "/board" }));
    expect(res).toBeDefined();
    expect(res!.status).toBe(307);
    expect(res!.headers.get("Location")).toBe("https://app.test/login");
  });

  it("lets an authenticated request through (no redirect)", () => {
    expect(middleware(req({ pathname: "/board", session: "abc" }))).toBeUndefined();
  });

  it("does not redirect the /login route itself (avoids a loop)", () => {
    expect(middleware(req({ pathname: "/login" }))).toBeUndefined();
  });
});
