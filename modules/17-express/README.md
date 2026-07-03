# Module 17 — Node HTTP & Express 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Build a REST server with **Express** — the last stop before NestJS. You wire routing, the
middleware chain, body parsing, a shared `Router`, and (the part everyone gets wrong) a
**centralized error-handling middleware**. Everything is injected — the repo, the id generator,
the log sink — so the whole server is testable in-process with `supertest`: no port, no clock,
no randomness. By the end the "layered split" (repo → service → router) is exactly the seam
Nest formalizes with providers and controllers.

## Concepts

- **Routing + the req/res lifecycle** — a request walks the middleware stack top-to-bottom until
  a handler calls `res.send`/`res.json` (or `next(err)`). `express.json()` is just middleware that
  parses the body onto `req.body` before your handler runs. A handler that never responds hangs;
  one that responds twice throws. Set the status explicitly (`res.status(201)`) — the default is
  `200`, and `POST` should answer `201` with a `Location` header.
- **The middleware chain is ordered composition** — `app.use(fn)` and `app.get(path, fn)` push
  handlers onto a stack. Auth, logging, and validation are just middleware that either call
  `next()` (continue) or short-circuit with a response. Registration order **is** execution order,
  which is why the error handler is mounted **last**.
- **Error handling is a 4-arg middleware** — Express recognizes `(err, req, res, next)` by arity
  and only routes to it when something calls `next(err)` (or throws synchronously). Async throws
  do **not** reach it unless you forward them — wrap async handlers so a rejected promise becomes
  `next(err)`. One error middleware maps a typed `AppError { status, message }` to that status and
  everything unknown to `500`, so handlers stay free of `try/catch`.

## Tasks

| #   | Task                    | Lane | Type | What you build                                             |
| --- | ----------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Express CRUD            | 🟢   | WE   | solved GET/POST /cards + analog /lists routes stub         |
| 2   | Middleware              | 🟡   | TODO | logging + auth + centralized error middleware              |
| 3   | Validation              | 🟢   | TODO | zod-validate request bodies; 400 on bad input              |
| 4   | Refactor toward modules | 🟡   | EXT  | split routes/services/repo layers (sets up the Nest model) |

## Theory & docs

- **Express CRUD** — [Basic routing](https://expressjs.com/en/starter/basic-routing.html) ·
  [Routing guide](https://expressjs.com/en/guide/routing.html) ·
  [API reference (`req`/`res`, `express.json`)](https://expressjs.com/en/5x/api.html)
- **Middleware** — [Using middleware](https://expressjs.com/en/guide/using-middleware.html) ·
  [Writing middleware](https://expressjs.com/en/guide/writing-middleware.html) ·
  [Error handling](https://expressjs.com/en/guide/error-handling.html)
- **Validation** — [Zod docs](https://zod.dev) ·
  [Error handling (mapping to `400`)](https://expressjs.com/en/guide/error-handling.html)
- **Refactor toward modules** — [`express.Router` (Routing guide)](https://expressjs.com/en/guide/routing.html) ·
  [Production best practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Done when

- [ ] CRUD returns the correct status codes: `GET /cards` → `200` list, `GET /cards/:id` →
      `200` or `404`, `POST /cards` → `201` + a `Location` header, `PUT`/`PATCH` → `200`/`404`,
      `DELETE` → `204`/`404`. The analog `/lists` router mirrors `/cards` exactly.
- [ ] `requireApiKey` answers `401` without the header and calls `next()` with it; a route that
      throws an `AppError` is caught by the error middleware and mapped to that status + JSON
      `{ error }`, and an unknown throw becomes `500`.
- [ ] `validateBody(schema)` responds `400 { error: "ValidationError", issues: [...] }` with the
      zod issue `path` + `message` on bad input, and attaches the parsed body + answers `201` on
      good input. The service layer rejects a duplicate title with `409`.

> **Worked example (WE):** `/cards` is fully solved in **both** `src/` and `solution/`; the analog
> `/lists` router throws `TODO` in `src/` — implement it by mirroring `/cards`. **TODO** tasks
> throw in `src/`; keep the signature and return shape, implement the body. **EXT** ships whole in
> `src/` — read the layered split and extend it. Tests import from `solution/`; point them at
> `../src/...` to grade your own build.
