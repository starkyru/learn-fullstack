import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMemoryRepo, seqIdGen, type Card } from "../solution/01-crud.js";
import { createValidatedCardsApp } from "../solution/03-validation.js";

function app() {
  return createValidatedCardsApp({
    repo: createMemoryRepo<Card>(),
    idgen: seqIdGen("card"),
  });
}

describe("validateBody + POST /cards", () => {
  it("201 + Location on a valid body", async () => {
    const res = await request(app()).post("/cards").send({ title: "Hello" });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe("/cards/card-1");
    expect(res.body).toEqual({ id: "card-1", title: "Hello" });
  });

  it("400 with the exact zod issue when title is missing", async () => {
    const res = await request(app()).post("/cards").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "ValidationError",
      issues: [{ path: ["title"], message: "Required" }],
    });
  });

  it("400 with the exact zod issue when title is too short", async () => {
    const res = await request(app()).post("/cards").send({ title: "ab" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "ValidationError",
      issues: [
        { path: ["title"], message: "String must contain at least 3 character(s)" },
      ],
    });
  });

  it("400 with the exact zod issue when title is the wrong type", async () => {
    const res = await request(app()).post("/cards").send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "ValidationError",
      issues: [{ path: ["title"], message: "Expected string, received number" }],
    });
  });

  it("strips unknown keys — the created card is exactly the parsed body", async () => {
    const res = await request(app())
      .post("/cards")
      .send({ title: "Hello", junk: "drop" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "card-1", title: "Hello" });
  });
});
