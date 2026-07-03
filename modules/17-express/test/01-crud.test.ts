import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createCardsApp,
  createListsApp,
  createMemoryRepo,
  seqIdGen,
  type Card,
  type List,
} from "../solution/01-crud.js";

function cardsApp(seed: Card[] = []) {
  return createCardsApp({ repo: createMemoryRepo<Card>(seed), idgen: seqIdGen("card") });
}

function listsApp(seed: List[] = []) {
  return createListsApp({ repo: createMemoryRepo<List>(seed), idgen: seqIdGen("list") });
}

describe("createCardsApp", () => {
  it("GET /cards → 200 with the seeded list", async () => {
    const seed: Card[] = [
      { id: "card-1", title: "A" },
      { id: "card-2", title: "B" },
    ];
    const res = await request(cardsApp(seed)).get("/cards");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(seed);
  });

  it("GET /cards/:id → 200 for a known id, 404 for an unknown one", async () => {
    const app = cardsApp([{ id: "card-1", title: "A" }]);

    const ok = await request(app).get("/cards/card-1");
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ id: "card-1", title: "A" });

    const miss = await request(app).get("/cards/nope");
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Card not found" });
  });

  it("POST /cards → 201 with a Location header and the created card (id from idgen)", async () => {
    const res = await request(cardsApp()).post("/cards").send({ title: "New" });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe("/cards/card-1");
    expect(res.body).toEqual({ id: "card-1", title: "New" });
  });

  it("POST /cards with no title → 400", async () => {
    const res = await request(cardsApp()).post("/cards").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });

  it("POST /cards with an empty-string title → 400", async () => {
    const res = await request(cardsApp()).post("/cards").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });

  it("PUT /cards/:id → 200 the updated card, 404 for an unknown id", async () => {
    const app = cardsApp([{ id: "card-1", title: "Old" }]);

    const upd = await request(app).put("/cards/card-1").send({ title: "New" });
    expect(upd.status).toBe(200);
    expect(upd.body).toEqual({ id: "card-1", title: "New" });

    const miss = await request(app).put("/cards/nope").send({ title: "X" });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Card not found" });
  });

  it("PUT /cards/:id with a missing title → 400 (validated before the id lookup)", async () => {
    const app = cardsApp([{ id: "card-1", title: "Old" }]);

    const res = await request(app).put("/cards/card-1").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });

  it("PATCH /cards/:id → 200 the updated card, 404 for an unknown id", async () => {
    const app = cardsApp([{ id: "card-1", title: "Old" }]);

    const upd = await request(app).patch("/cards/card-1").send({ title: "Patched" });
    expect(upd.status).toBe(200);
    expect(upd.body).toEqual({ id: "card-1", title: "Patched" });

    const miss = await request(app).patch("/cards/nope").send({ title: "X" });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "Card not found" });
  });

  it("DELETE /cards/:id → 204 (empty body) then 404 on the second delete", async () => {
    const app = cardsApp([{ id: "card-1", title: "A" }]);

    const del = await request(app).delete("/cards/card-1");
    expect(del.status).toBe(204);
    expect(del.body).toEqual({});

    const again = await request(app).delete("/cards/card-1");
    expect(again.status).toBe(404);
    expect(again.body).toEqual({ error: "Card not found" });
  });
});

describe("createListsApp (analog mirrors /cards)", () => {
  it("POST /lists → 201 + Location, GET /lists → 200 list, GET unknown → 404", async () => {
    const app = listsApp();

    const created = await request(app).post("/lists").send({ title: "L" });
    expect(created.status).toBe(201);
    expect(created.headers.location).toBe("/lists/list-1");
    expect(created.body).toEqual({ id: "list-1", title: "L" });

    const list = await request(app).get("/lists");
    expect(list.status).toBe(200);
    expect(list.body).toEqual([{ id: "list-1", title: "L" }]);

    const miss = await request(app).get("/lists/nope");
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: "List not found" });
  });
});
