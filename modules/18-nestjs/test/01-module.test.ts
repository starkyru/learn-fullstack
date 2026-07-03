import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CardsController,
  CardsModule,
  CardsService,
  ListsController,
  ListsModule,
  ListsService,
} from "../solution/01-module.js";

describe("Task 1 — module + controller + service", () => {
  describe("cards (worked example)", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const ref = await Test.createTestingModule({ imports: [CardsModule] }).compile();
      app = ref.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it("DI resolves the SAME service instance into the controller", () => {
      const controller = app.get(CardsController);
      const service = app.get(CardsService);
      expect(controller).toBeInstanceOf(CardsController);
      expect((controller as unknown as { cards: CardsService }).cards).toBe(service);
    });

    it("POST /cards → 201 with an injected, deterministic id", async () => {
      const res = await request(app.getHttpServer())
        .post("/cards")
        .send({ title: "Alpha" });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: "1", title: "Alpha" });
    });

    it("GET /cards → 200 lists what was created, ids incrementing 1,2", async () => {
      await request(app.getHttpServer()).post("/cards").send({ title: "Alpha" });
      await request(app.getHttpServer()).post("/cards").send({ title: "Beta" });

      const res = await request(app.getHttpServer()).get("/cards");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { id: "1", title: "Alpha" },
        { id: "2", title: "Beta" },
      ]);
    });

    it("GET /cards/:id → 200 for a hit, 404 for a miss", async () => {
      await request(app.getHttpServer()).post("/cards").send({ title: "Alpha" });

      const hit = await request(app.getHttpServer()).get("/cards/1");
      expect(hit.status).toBe(200);
      expect(hit.body).toEqual({ id: "1", title: "Alpha" });

      const miss = await request(app.getHttpServer()).get("/cards/999");
      expect(miss.status).toBe(404);
      expect(miss.body.message).toBe("Card 999 not found");
    });
  });

  describe("lists (your analog)", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const ref = await Test.createTestingModule({ imports: [ListsModule] }).compile();
      app = ref.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it("DI resolves the service into the controller", () => {
      const controller = app.get(ListsController);
      const service = app.get(ListsService);
      expect((controller as unknown as { lists: ListsService }).lists).toBe(service);
    });

    it("mirrors /cards: POST → 201, GET list → 200, GET miss → 404", async () => {
      const created = await request(app.getHttpServer())
        .post("/lists")
        .send({ title: "Todo" });
      expect(created.status).toBe(201);
      expect(created.body).toEqual({ id: "1", title: "Todo" });

      const list = await request(app.getHttpServer()).get("/lists");
      expect(list.status).toBe(200);
      expect(list.body).toEqual([{ id: "1", title: "Todo" }]);

      const miss = await request(app.getHttpServer()).get("/lists/999");
      expect(miss.status).toBe(404);
      expect(miss.body.message).toBe("List 999 not found");
    });
  });
});
