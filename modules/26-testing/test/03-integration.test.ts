import { withEphemeralPostgres } from "@learn-fullstack/testing";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { CardRepo } from "../solution/03-integration.js";
import { CARD_REPO, CardsModule } from "../solution/03-integration.js";

describe("Task 3 — Nest integration against ephemeral Postgres", () => {
  it("creates and reads a card through the real pg-backed repo", async () => {
    await withEphemeralPostgres(async (databaseUrl) => {
      const ref = await Test.createTestingModule({
        imports: [CardsModule.forRoot(databaseUrl)],
      }).compile();
      const app = ref.createNestApplication();
      await app.init();

      try {
        await app.get<CardRepo>(CARD_REPO).migrate();

        const created = await request(app.getHttpServer())
          .post("/cards")
          .send({ title: "Ship it" });
        expect(created.status).toBe(201);
        expect(created.body).toEqual({ id: 1, title: "Ship it" });

        const listed = await request(app.getHttpServer()).get("/cards");
        expect(listed.status).toBe(200);
        expect(listed.body).toEqual([{ id: 1, title: "Ship it" }]);

        // a second insert gets the next serial id, and both come back ordered
        await request(app.getHttpServer()).post("/cards").send({ title: "Then this" });
        const both = await request(app.getHttpServer()).get("/cards");
        expect(both.body).toEqual([
          { id: 1, title: "Ship it" },
          { id: 2, title: "Then this" },
        ]);
      } finally {
        await app.close();
      }
    });
  }, 60000);
});
