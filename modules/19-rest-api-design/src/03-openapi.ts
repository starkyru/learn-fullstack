/**
 * OpenAPI 3.1 from an in-code route registry.
 *
 * The registry (below) already describes every route as data. `listRegisteredRoutes` and `createApi`
 * are wired for you; `GET /openapi.json` serves whatever `buildOpenApiDocument` returns.
 *
 * YOUR TURN — implement `buildOpenApiDocument(registry)`:
 *   1) Return `{ openapi: "3.1.0", info, paths, components }`.
 *   2) `paths`: for each route, set `paths[path][method] = { summary, parameters?, requestBody?,
 *      responses }`. Map each response to `{ description, content: { "application/json": { schema } } }`
 *      (omit `content` when the route response has no schema). Merge two methods on the same path.
 *   3) `components.schemas`: define `Card`, `Problem`, and `CreateCard` (the `$ref` targets used in
 *      the registry) as JSON Schema objects.
 *   4) The resulting path set MUST equal `listRegisteredRoutes(registry)` — no drift.
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
  _registry: readonly RouteDef[] = routeRegistry,
): OpenApiDocument {
  throw new Error(
    "TODO: derive the OpenAPI 3.1 document (paths + components.schemas) from the registry",
  );
}

export function createApi(): Express {
  const app = express();
  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(buildOpenApiDocument());
  });
  return app;
}
