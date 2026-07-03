import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GraphqlModule } from "../solution/01-resolvers.js";

describe("Task 1 — code-first resolvers", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [GraphqlModule] }).compile();
    app = ref.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const gql = (query: string) =>
    request(app.getHttpServer()).post("/graphql").send({ query });

  it("users query resolves the nested lists field (worked example)", async () => {
    const res = await gql(`{ users { id name lists { id title } } }`);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.users).toEqual([
      {
        id: "u1",
        name: "Ada",
        lists: [
          { id: "l1", title: "Todo" },
          { id: "l2", title: "Doing" },
        ],
      },
      { id: "u2", name: "Grace", lists: [{ id: "l3", title: "Done" }] },
    ]);
  });

  it("user(id) returns one user for a hit and null for a miss", async () => {
    const hit = await gql(`{ user(id: "u2") { id name } }`);
    expect(hit.body.data.user).toEqual({ id: "u2", name: "Grace" });

    const miss = await gql(`{ user(id: "nope") { id name } }`);
    expect(miss.body.data.user).toBeNull();
  });

  it("cards analog query resolves Card.list, mirroring User.lists", async () => {
    const res = await gql(`{ cards { id title list { id title } } }`);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.cards).toEqual([
      { id: "c1", title: "Alpha", list: { id: "l1", title: "Todo" } },
      { id: "c2", title: "Beta", list: { id: "l2", title: "Doing" } },
      { id: "c3", title: "Gamma", list: { id: "l1", title: "Todo" } },
    ]);
  });

  it("the schema is typed: an unknown field is rejected before execution", async () => {
    const res = await gql(`{ cards { bogusField } }`);
    expect(res.body.errors).toBeDefined();
    expect(res.body.data).toBeUndefined();
    expect(res.body.errors[0].message).toMatch(/bogusField/);
  });
});
