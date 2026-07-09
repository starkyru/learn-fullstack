export interface Resource {
  id: string;
  [key: string]: unknown;
}

export interface ResourceStore {
  items: Map<string, Resource>;
  nextId: number;
}

export interface RestRequest {
  method: string;
  path: string; // "/widgets" (collection) or "/widgets/42" (item)
  body?: unknown;
}

export interface RestResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

export function createStore(): ResourceStore {
  return { items: new Map(), nextId: 1 };
}

/**
 * YOUR TURN — a tiny REST resource handler over an in-memory store. This is the REST
 * *uniform interface* in miniature: verbs map to CRUD, and the status codes carry meaning.
 * (Deep API design — versioning, cursor pagination, OpenAPI, problem+json — is Module 19.)
 *
 * Parse `path` into a collection ("/widgets") vs an item ("/widgets/:id"), then dispatch:
 *
 * Collection ("/widgets"):
 *   GET  → 200, body = array of every stored resource (safe: no mutation).
 *   POST → 201: assign a server id with `String(store.nextId++)`, store `{ ...body, id }`,
 *          set a `Location: /widgets/:id` header, body = the new resource. NOT idempotent.
 *   other method → 405 with an `Allow: "GET, POST"` header.
 * Item ("/widgets/:id"):
 *   GET    → 200 + the resource, or 404 if absent.
 *   PUT    → full replace at the client's id; 200 if it already existed, else 201 + `Location`.
 *            Idempotent: the same id+body twice ⇒ the same final state.
 *   DELETE → 204 if it existed, 404 if not. Idempotent: the resource is absent either way.
 *   other method → 405 with an `Allow: "GET, PUT, DELETE"` header.
 */
export function restHandler(_req: RestRequest, _store: ResourceStore): RestResponse {
  throw new Error("TODO: map method + path to a REST resource operation");
}
