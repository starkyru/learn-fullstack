import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createCardRepo,
  createLayeredApp,
  errorHandler,
  seqIdGen,
  type Card,
} from "../solution/04-layers.js";

function app(seed: Card[] = []) {
  return createLayeredApp({ repo: createCardRepo(seed), idgen: seqIdGen("card") });
}

describe("layered app (repo → service → router)", () => {
  it("POST /cards → 201 + Location + the card the service created", async () => {
    const res = await request(app()).post("/cards").send({ title: "First" });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe("/cards/card-1");
    expect(res.body).toEqual({ id: "card-1", title: "First" });
  });

  it("GET /cards → 200 with the seeded list", async () => {
    const res = await request(app([{ id: "card-9", title: "Seeded" }])).get("/cards");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "card-9", title: "Seeded" }]);
  });

  it("service rejects a duplicate title → 409 with the domain message", async () => {
    const server = app();

    const first = await request(server).post("/cards").send({ title: "Dup" });
    expect(first.status).toBe(201);

    const second = await request(server).post("/cards").send({ title: "Dup" });
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: "A card with that title already exists" });
  });

  it("service rejects an empty title → 400", async () => {
    const res = await request(app()).post("/cards").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });

  it("a duplicate against a SEEDED card is rejected → 409", async () => {
    const res = await request(app([{ id: "card-1", title: "Exists" }]))
      .post("/cards")
      .send({ title: "Exists" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "A card with that title already exists" });
  });

  it("errorHandler maps a non-ServiceError (plain Error) to the 500 fallback", async () => {
    // Exercise the REAL exported errorHandler with a plain Error (not a ServiceError),
    // so only the 500 fallback branch is hit.
    const boom = express();
    boom.get("/boom", () => {
      throw new Error("unexpected failure");
    });
    boom.use(errorHandler);

    const res = await request(boom).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
  });
});
