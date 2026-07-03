# Module 19 — REST API Design

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Design a clean, **versioned** REST API and describe it — self-contained in Express (no Nest, no DB,
no `packages/api-client`; you build the OpenAPI document and the typed client right here). You model
nested resources with correct status codes, emit RFC 7807 `application/problem+json` errors, page
with a **stable cursor**, filter and sort, generate an OpenAPI 3.1 spec from an in-code route
registry, and derive a typed client from that spec.

## Concepts

- **Resource modeling & status codes** — resources are nouns under a version prefix
  (`/v1/boards/:boardId/cards`). `GET` a collection → `200 { data }`; `POST` → `201` + a `Location`
  header pointing at the new resource; a bad body → `400`; an unknown parent → `404`. Errors are
  **RFC 7807 problem+json**: `Content-Type: application/problem+json` and a body of
  `{ type, title, status, detail, instance }` — machine-readable, not a bare `{ error }` string.
- **Cursor (keyset) pagination is stable; offset pagination is not** — encode the cursor from the
  **last row's stable sort key** (base64url of `field`+`id`), and page by "give me rows _after_ this
  key". A row inserted _before_ the cursor position does not shift the page, so you never skip or
  duplicate — unlike `LIMIT/OFFSET`, where an insert before the offset repeats a row. Layer
  `filter` (`?status=done`) and `sort` (`?sort=title` / `?sort=-createdAt`) on top; the composite
  `(sortValue, id)` order keeps the cursor a total order.
- **OpenAPI from a route registry** — describe every route once as data (method, path, params,
  request/response schemas), then _derive_ the OpenAPI 3.1 document and serve it at `/openapi.json`.
  A `listRegisteredRoutes` helper lets a test assert the spec covers **every** route — no drift.
- **A typed client is generated from the spec's schemas** — `createClient(baseUrl, fetchImpl)`
  exposes `listCards` / `getCard` / `createCard` whose argument and return types come straight from
  the documented schemas, so the client and the server can't disagree at compile time.

## Tasks

| #   | Task                   | Lane | Type | What you build                                             |
| --- | ---------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Resource design        | 🟢   | WE   | solved `/boards/:id/cards` design + analog `/lists` stub   |
| 2   | Pagination & filtering | 🟡   | TODO | cursor pagination + filter/sort query params               |
| 3   | OpenAPI/Swagger        | 🟢   | TODO | generate Swagger from Nest decorators; export the spec     |
| 4   | Typed client from spec | 🟡   | EXT  | generate `packages/api-client` types from the OpenAPI spec |

## Theory & docs

- **Resource design** — [HTTP status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) ·
  [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) ·
  [RFC 7807 — `application/problem+json`](https://www.rfc-editor.org/rfc/rfc7807)
- **Pagination & filtering** — [`URLSearchParams` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) ·
  [RFC 4648 — base64url (cursor encoding)](https://www.rfc-editor.org/rfc/rfc4648)
- **OpenAPI/Swagger** — [OpenAPI 3.1 specification](https://spec.openapis.org/oas/v3.1.0.html) ·
  [learn.openapis.org](https://learn.openapis.org/)
- **Typed client from spec** — [JSON Schema (OpenAPI 3.1 schemas)](https://json-schema.org/) ·
  [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- Background — [MDN HTTP docs](https://developer.mozilla.org/en-US/docs/Web/HTTP) ·
  [`Location` header (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Location)

## Done when

- [ ] Endpoints use the **correct status codes** (`200`/`201` + `Location`/`400`/`404`) and every
      error is `application/problem+json` with a `{ type, title, status, detail, instance }` body.
- [ ] **Cursor pagination is stable under inserts** — a row inserted before the cursor position does
      not duplicate or skip rows across two page fetches; `filter` and `sort` return the exact subset.
- [ ] **Swagger lists every route** — `/openapi.json` is OpenAPI 3.1 and its path set equals the
      route registry.
- [ ] The **generated client type-checks** and round-trips a create + list against the app.

> **Worked example (WE, task 1):** `src/` has the `/cards` resource solved as a reference; you
> complete the sibling `/lists` analog (its handlers `throw` in `src/`). **TODO (tasks 2–3):** `src/`
> throws — implement it. **EXT (task 4):** `src/` already mirrors the solution; read and extend it.
> Tests import from `solution/`; flip to `../src/...` to grade your own build.
