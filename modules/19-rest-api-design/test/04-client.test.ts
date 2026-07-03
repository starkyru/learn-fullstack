import { describe, it, expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import {
  createClient,
  ProblemError,
  type FetchImpl,
  type Card,
} from "../solution/04-client.js";
import { createApi } from "../solution/02-pagination.js";

// In-memory fetch: turn a client request into an in-process supertest call against the app.
// This is the only "boundary" — no real network, no listening port.
function fetchInto(app: Express): FetchImpl {
  return async (url, init) => {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    const method = (init?.method ?? "GET").toUpperCase();
    const agent = request(app);
    let req = method === "POST" ? agent.post(path) : agent.get(path);
    for (const [k, v] of Object.entries(init?.headers ?? {})) req = req.set(k, v);
    const res = init?.body !== undefined ? await req.send(init.body) : await req;
    return { status: res.status, json: async () => res.body as unknown };
  };
}

function makeClient() {
  let n = 0;
  const app = createApi({ generateId: () => `new_${++n}` });
  return createClient("http://api.test", fetchInto(app));
}

describe("typed client generated from the spec", () => {
  it("round-trips a create then list; the created card comes back intact", async () => {
    const client = makeClient();

    const created: Card = await client.createCard("b1", {
      title: "Client Made",
      status: "todo",
      createdAt: "2020-01-01T00:00:06.000Z",
    });
    expect(created).toEqual({
      id: "new_1",
      boardId: "b1",
      title: "Client Made",
      status: "todo",
      createdAt: "2020-01-01T00:00:06.000Z",
    });

    const page = await client.listCards("b1", { sort: "createdAt", limit: 50 });
    expect(page.nextCursor).toBeNull();
    const found = page.data.find((c) => c.id === "new_1");
    expect(found).toEqual(created);
    // It sorts last by createdAt (00:00:06 is newest).
    expect(page.data[page.data.length - 1]?.id).toBe("new_1");
  });

  it("getCard fetches a single created card", async () => {
    const client = makeClient();
    const created = await client.createCard("b1", {
      title: "Fetch Me",
      createdAt: "2020-01-01T00:00:07.000Z",
    });
    const fetched = await client.getCard("b1", created.id);
    expect(fetched).toEqual(created);
  });

  it("listCards forwards the status filter to the query string", async () => {
    const client = makeClient();
    const page = await client.listCards("b1", { status: "done" });
    expect(page.data.map((c) => c.id)).toEqual(["c2", "c4"]);
  });

  it("throws a typed ProblemError on a 404", async () => {
    const client = makeClient();
    await expect(client.getCard("b1", "missing")).rejects.toBeInstanceOf(ProblemError);
    try {
      await client.getCard("b1", "missing");
      throw new Error("expected rejection");
    } catch (err) {
      expect(err).toBeInstanceOf(ProblemError);
      const problem = (err as ProblemError).problem;
      expect(problem.status).toBe(404);
      expect(problem.title).toBe("Card Not Found");
    }
  });
});
