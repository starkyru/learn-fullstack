# Module 03 — HTTP & the Web Platform

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The wire protocol and browser primitives every full-stack app sits on: methods, status
codes, headers, CORS, cookies, caching, `fetch`, and the **REST** conventions layered on top.

## Concepts

- **Requests & responses** — methods (GET/POST/PATCH/DELETE), status classes (2xx/3xx/4xx/
  5xx), and headers as the metadata channel.
- **REST** — an architectural style _on top of_ HTTP: model the API as **resources** (nouns,
  e.g. `/widgets/42`) and drive them through the **uniform interface** — verbs map to CRUD
  (`GET` read · `POST` create · `PUT` replace · `DELETE` remove). `GET` is **safe** (no side
  effects); `PUT`/`DELETE` are **idempotent** (repeat ⇒ same state) while `POST` is not. The
  status code is part of the contract: `201 + Location` on create, `204` on delete, `404`
  for a missing resource, `405 + Allow` for an unsupported verb. Statelessness: each request
  carries everything the server needs. **Deep API design** — versioning, cursor pagination,
  OpenAPI, `problem+json` errors — is **Module 19**; here you just internalize the verbs,
  status codes, and idempotency.
- **CORS** — the browser blocks cross-origin reads unless the server returns
  `Access-Control-Allow-Origin` (and, for credentials, `Allow-Credentials` + a specific
  origin, never `*`).
- **Caching** — `ETag` + `If-None-Match` let a server answer `304 Not Modified` and skip
  re-sending an unchanged body.
- **`fetch`** — the universal client; wrap it for timeouts, retries, and de-duplication.

## Tasks

| #   | Task                   | Lane | Type | What you build                                                        |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Raw HTTP client        | 🟢   | WE   | solved `httpGet` + analog `httpPost` over `fetch`                     |
| 2   | CORS & cookies lab     | 🟡   | TODO | `corsHeaders(origin, allowlist)` returning the right headers          |
| 3   | HTTP cache semantics   | 🟢   | TODO | `conditionalResponse()` → `304` when `If-None-Match` matches the ETag |
| 4   | Mini fetch retry/queue | 🔴   | FS   | `createFetcher()` — timeout + retry + in-flight de-dupe, no axios     |
| 5   | REST resource handler  | 🟡   | TODO | `restHandler(req, store)` — verbs↔CRUD, status codes, idempotency     |

## Theory & docs

- **Raw HTTP client** — [An overview of HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview),
  [Using the Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- **CORS & cookies lab** — [Cross-Origin Resource Sharing (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS),
  [Using HTTP cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- **HTTP cache semantics** — [HTTP caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching),
  [ETag (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)
- **Mini fetch retry/queue** — [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API),
  [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- **REST resource handler** — [REST (MDN glossary)](https://developer.mozilla.org/en-US/docs/Glossary/REST),
  [Idempotent (MDN glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent),
  [Safe/HTTP (MDN glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) —
  deep design continues in **Module 19 (REST API Design)**
- **Background** — [HTTP request methods (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods),
  [HTTP response status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)

## Done when

- [ ] `httpPost` sends a JSON body and parses the JSON response.
- [ ] `corsHeaders` echoes an allowed origin and omits `Allow-Origin` for a disallowed one.
- [ ] `conditionalResponse` returns `304` on an ETag match and `200 + ETag` otherwise.
- [ ] `createFetcher` retries a failing request and collapses concurrent same-URL calls into one.
- [ ] `restHandler` maps verbs to CRUD with the right status codes (`200`/`201`+`Location`/`204`/
      `404`/`405`+`Allow`); `POST` mints a new id each call while `PUT`/`DELETE` are idempotent.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
