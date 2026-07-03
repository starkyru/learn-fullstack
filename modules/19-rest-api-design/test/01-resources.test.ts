import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApi } from "../solution/01-resources.js";

// Deterministic clock + id so a created row is fully predictable.
function makeApp() {
  let n = 0;
  return createApi({
    now: () => "2020-06-01T12:00:00.000Z",
    generateId: () => `new_${++n}`,
  });
}

describe("resource design — /v1/boards/:boardId/cards", () => {
  it("GET returns 200 with the seeded collection for a known board", async () => {
    const res = await request(makeApp()).get("/v1/boards/b1/cards");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          id: "c1",
          boardId: "b1",
          title: "Set up repo",
          status: "done",
          createdAt: "2020-01-01T00:00:01.000Z",
        },
        {
          id: "c2",
          boardId: "b1",
          title: "Write tests",
          status: "todo",
          createdAt: "2020-01-01T00:00:02.000Z",
        },
        {
          id: "c3",
          boardId: "b1",
          title: "Ship it",
          status: "doing",
          createdAt: "2020-01-01T00:00:03.000Z",
        },
      ],
    });
  });

  it("GET an unknown board returns a 404 application/problem+json document", async () => {
    const res = await request(makeApp()).get("/v1/boards/nope/cards");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual({
      type: "about:blank",
      title: "Board Not Found",
      status: 404,
      detail: "No board exists with id 'nope'.",
      instance: "/v1/boards/nope/cards",
    });
  });

  it("POST creates a card: 201, Location header, and the exact new resource", async () => {
    const res = await request(makeApp())
      .post("/v1/boards/b1/cards")
      .send({ title: "Review PR" });
    expect(res.status).toBe(201);
    expect(res.headers["location"]).toBe("/v1/boards/b1/cards/new_1");
    expect(res.body).toEqual({
      id: "new_1",
      boardId: "b1",
      title: "Review PR",
      status: "todo",
      createdAt: "2020-06-01T12:00:00.000Z",
    });
  });

  it("POST honors an explicit status", async () => {
    const res = await request(makeApp())
      .post("/v1/boards/b1/cards")
      .send({ title: "In flight", status: "doing" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("doing");
  });

  it("POST with an empty title returns a 400 problem+json", async () => {
    const res = await request(makeApp()).post("/v1/boards/b1/cards").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.title).toBe("Invalid Card");
    expect(res.body.status).toBe(400);
    expect(res.body.type).toBe("about:blank");
    // The `detail` must carry the mapped zod issue (path + message), not a generic string.
    expect(res.body.detail).toBe("title: String must contain at least 1 character(s)");
  });

  it("GET the /lists analog returns 200 with the seeded lists", async () => {
    const res = await request(makeApp()).get("/v1/boards/b1/lists");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: [
        {
          id: "l1",
          boardId: "b1",
          name: "Backlog",
          createdAt: "2020-01-01T00:00:01.000Z",
        },
      ],
    });
  });

  it("POST the /lists analog: 201, Location header, and the exact new list", async () => {
    const res = await request(makeApp())
      .post("/v1/boards/b1/lists")
      .send({ name: "Doing" });
    expect(res.status).toBe(201);
    expect(res.headers["location"]).toBe("/v1/boards/b1/lists/new_1");
    expect(res.body).toEqual({
      id: "new_1",
      boardId: "b1",
      name: "Doing",
      createdAt: "2020-06-01T12:00:00.000Z",
    });
  });
});
