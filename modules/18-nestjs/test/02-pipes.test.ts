import type { ArgumentMetadata, INestApplication } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ParseIntParamPipe, PipesModule } from "../solution/02-pipes.js";

const META: ArgumentMetadata = { type: "param", metatype: Number, data: "id" };

describe("Task 2 — pipes & validation", () => {
  describe("ValidationPipe + CreateCardDto", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const ref = await Test.createTestingModule({ imports: [PipesModule] }).compile();
      app = ref.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it("accepts a valid body → 201, strips unknown keys (whitelist) and transforms to a DTO", async () => {
      const res = await request(app.getHttpServer())
        .post("/cards")
        .send({ title: "Buy milk", sneaky: "dropme" });
      expect(res.status).toBe(201);
      expect(res.body.created).toBe("Buy milk");
      // whitelist:true → the unknown `sneaky` key is stripped, so only `title` survives.
      expect(res.body.keys).toEqual(["title"]);
      // transform:true → the handler received a real CreateCardDto instance, not a plain object.
      expect(res.body.isDto).toBe(true);
    });

    it("rejects an empty title → 400 with the class-validator message", async () => {
      const res = await request(app.getHttpServer()).post("/cards").send({ title: "" });
      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(["title should not be empty"]);
    });

    it("rejects a too-long title → 400 with the MaxLength message", async () => {
      const res = await request(app.getHttpServer())
        .post("/cards")
        .send({ title: "x".repeat(51) });
      expect(res.status).toBe(400);
      expect(res.body.message).toEqual([
        "title must be shorter than or equal to 50 characters",
      ]);
    });
  });

  describe("custom ParseIntParamPipe", () => {
    it("parses a base-10 integer string (unit)", () => {
      const pipe = new ParseIntParamPipe();
      expect(pipe.transform("42", META)).toBe(42);
      expect(pipe.transform("-7", META)).toBe(-7);
    });

    it("throws BadRequestException on non-integer input (unit)", () => {
      const pipe = new ParseIntParamPipe();
      expect(() => pipe.transform("abc", META)).toThrow(BadRequestException);
      expect(() => pipe.transform("abc", META)).toThrow(
        'Validation failed: "abc" is not an integer',
      );
      expect(() => pipe.transform("4.2", META)).toThrow(BadRequestException);
      // Anchored regex: trailing garbage and empty string are rejected too (guards `^...$`).
      expect(() => pipe.transform("42x", META)).toThrow(BadRequestException);
      expect(() => pipe.transform("", META)).toThrow(BadRequestException);
    });

    it("wired into a route: 200 parsed number for '42', 400 for 'abc'", async () => {
      const ref = await Test.createTestingModule({ imports: [PipesModule] }).compile();
      const app = ref.createNestApplication();
      await app.init();

      const ok = await request(app.getHttpServer()).get("/cards/42");
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ id: 42, type: "number" });

      const bad = await request(app.getHttpServer()).get("/cards/abc");
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Validation failed: "abc" is not an integer');

      await app.close();
    });
  });
});
