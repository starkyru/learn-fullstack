import { describe, it, expect } from "vitest";
import request from "supertest";
import {
  createApi,
  buildOpenApiDocument,
  listRegisteredRoutes,
} from "../solution/03-openapi.js";

// Hand-written expected route set (independent of the generator).
const EXPECTED_ROUTES = [
  "GET /v1/boards/{boardId}/cards",
  "GET /v1/boards/{boardId}/cards/{cardId}",
  "POST /v1/boards/{boardId}/cards",
].sort();

function routeSetFromDoc(doc: {
  paths: Record<string, Record<string, unknown>>;
}): string[] {
  const found: string[] = [];
  for (const [path, ops] of Object.entries(doc.paths)) {
    for (const method of Object.keys(ops)) {
      found.push(`${method.toUpperCase()} ${path}`);
    }
  }
  return found.sort();
}

describe("OpenAPI 3.1 from the route registry", () => {
  it("serves the document at GET /openapi.json as OpenAPI 3.1", async () => {
    const res = await request(createApi()).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.info).toEqual({ title: "Boards & Cards API", version: "1.0.0" });
  });

  it("the spec's path set equals every registered route", async () => {
    const res = await request(createApi()).get("/openapi.json");
    expect(routeSetFromDoc(res.body)).toEqual(EXPECTED_ROUTES);
    // The registry projection agrees with the hand-written checklist too.
    expect(listRegisteredRoutes()).toEqual(EXPECTED_ROUTES);
  });

  it("the list operation documents its path + query parameters", () => {
    const doc = buildOpenApiDocument();
    const op = doc.paths["/v1/boards/{boardId}/cards"]?.get as {
      parameters: Array<{ name: string; in: string; required: boolean }>;
    };
    const names = op.parameters.map((p) => p.name).sort();
    expect(names).toEqual(["boardId", "cursor", "limit", "sort", "status"]);
    const boardId = op.parameters.find((p) => p.name === "boardId");
    expect(boardId).toMatchObject({ in: "path", required: true });
  });

  it("the create operation documents a JSON request body and 201/400/404 responses", () => {
    const doc = buildOpenApiDocument();
    const op = doc.paths["/v1/boards/{boardId}/cards"]?.post as {
      requestBody: { content: Record<string, unknown> };
      responses: Record<string, unknown>;
    };
    expect(Object.keys(op.requestBody.content)).toEqual(["application/json"]);
    expect(Object.keys(op.responses).sort()).toEqual(["201", "400", "404"]);
  });

  it("components.schemas defines Card and the RFC 7807 Problem shape", () => {
    const doc = buildOpenApiDocument();
    const card = doc.components.schemas.Card as { properties: Record<string, unknown> };
    expect(Object.keys(card.properties).sort()).toEqual([
      "boardId",
      "createdAt",
      "id",
      "status",
      "title",
    ]);
    const problem = doc.components.schemas.Problem as { required: string[] };
    expect(problem.required).toEqual(["type", "title", "status", "detail", "instance"]);
  });
});
