/**
 * OpenAPI 3.1 from an in-code route registry.
 *
 * Describe every route once as data (`routeRegistry`), then DERIVE the OpenAPI document from it and
 * serve it at `GET /openapi.json`. `listRegisteredRoutes` projects the registry to a `METHOD path`
 * set so a test can assert the spec covers every route with no drift.
 *
 * (The curriculum says "from Nest decorators" — same idea; here the registry IS the metadata.)
 */
import express from "express";
import type { Express } from "express";

export type JsonSchema = { [key: string]: unknown };

export interface RouteParam {
  name: string;
  in: "path" | "query";
  required: boolean;
  schema: JsonSchema;
}

export interface RouteResponse {
  description: string;
  schema?: JsonSchema;
}

export interface RouteDef {
  method: "get" | "post";
  /** OpenAPI-style path, e.g. `/v1/boards/{boardId}/cards`. */
  path: string;
  summary: string;
  params?: RouteParam[];
  requestBody?: JsonSchema;
  responses: Record<string, RouteResponse>;
}

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, JsonSchema> };
}

const cardSchema: JsonSchema = {
  type: "object",
  required: ["id", "boardId", "title", "status", "createdAt"],
  properties: {
    id: { type: "string" },
    boardId: { type: "string" },
    title: { type: "string" },
    status: { type: "string", enum: ["todo", "doing", "done"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

const problemSchema: JsonSchema = {
  type: "object",
  required: ["type", "title", "status", "detail", "instance"],
  properties: {
    type: { type: "string" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
    instance: { type: "string" },
  },
};

const createCardSchema: JsonSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string", minLength: 1 },
    status: { type: "string", enum: ["todo", "doing", "done"] },
  },
};

export const routeRegistry: readonly RouteDef[] = [
  {
    method: "get",
    path: "/v1/boards/{boardId}/cards",
    summary: "List cards on a board",
    params: [
      { name: "boardId", in: "path", required: true, schema: { type: "string" } },
      { name: "limit", in: "query", required: false, schema: { type: "integer" } },
      { name: "cursor", in: "query", required: false, schema: { type: "string" } },
      { name: "sort", in: "query", required: false, schema: { type: "string" } },
      { name: "status", in: "query", required: false, schema: { type: "string" } },
    ],
    responses: {
      "200": {
        description: "A page of cards",
        schema: {
          type: "object",
          required: ["data", "nextCursor"],
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Card" } },
            nextCursor: { type: ["string", "null"] },
          },
        },
      },
      "404": {
        description: "Board not found",
        schema: { $ref: "#/components/schemas/Problem" },
      },
    },
  },
  {
    method: "post",
    path: "/v1/boards/{boardId}/cards",
    summary: "Create a card on a board",
    params: [{ name: "boardId", in: "path", required: true, schema: { type: "string" } }],
    requestBody: { $ref: "#/components/schemas/CreateCard" },
    responses: {
      "201": {
        description: "The created card",
        schema: { $ref: "#/components/schemas/Card" },
      },
      "400": {
        description: "Validation error",
        schema: { $ref: "#/components/schemas/Problem" },
      },
      "404": {
        description: "Board not found",
        schema: { $ref: "#/components/schemas/Problem" },
      },
    },
  },
  {
    method: "get",
    path: "/v1/boards/{boardId}/cards/{cardId}",
    summary: "Fetch a single card",
    params: [
      { name: "boardId", in: "path", required: true, schema: { type: "string" } },
      { name: "cardId", in: "path", required: true, schema: { type: "string" } },
    ],
    responses: {
      "200": { description: "The card", schema: { $ref: "#/components/schemas/Card" } },
      "404": {
        description: "Card not found",
        schema: { $ref: "#/components/schemas/Problem" },
      },
    },
  },
];

/** Projects the registry to a sorted `METHOD path` set — the "every route" checklist. */
export function listRegisteredRoutes(
  registry: readonly RouteDef[] = routeRegistry,
): string[] {
  return registry.map((r) => `${r.method.toUpperCase()} ${r.path}`).sort();
}

export function buildOpenApiDocument(
  registry: readonly RouteDef[] = routeRegistry,
): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of registry) {
    const responses: Record<string, unknown> = {};
    for (const [code, r] of Object.entries(route.responses)) {
      responses[code] = {
        description: r.description,
        ...(r.schema ? { content: { "application/json": { schema: r.schema } } } : {}),
      };
    }

    const operation: Record<string, unknown> = { summary: route.summary, responses };
    if (route.params && route.params.length > 0) {
      operation.parameters = route.params.map((p) => ({
        name: p.name,
        in: p.in,
        required: p.required,
        schema: p.schema,
      }));
    }
    if (route.requestBody) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { schema: route.requestBody } },
      };
    }

    const forPath = paths[route.path] ?? {};
    forPath[route.method] = operation;
    paths[route.path] = forPath;
  }

  return {
    openapi: "3.1.0",
    info: { title: "Boards & Cards API", version: "1.0.0" },
    paths,
    components: {
      schemas: { Card: cardSchema, Problem: problemSchema, CreateCard: createCardSchema },
    },
  };
}

export function createApi(): Express {
  const app = express();
  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(buildOpenApiDocument());
  });
  return app;
}
