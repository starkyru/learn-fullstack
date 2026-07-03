# Module 03 — HTTP & the Web Platform

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The wire protocol and browser primitives every full-stack app sits on: methods, status
codes, headers, CORS, cookies, caching, and `fetch`.

## Concepts

- **Requests & responses** — methods (GET/POST/PATCH/DELETE), status classes (2xx/3xx/4xx/
  5xx), and headers as the metadata channel.
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

## Theory & docs

- **Raw HTTP client** — [An overview of HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview),
  [Using the Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- **CORS & cookies lab** — [Cross-Origin Resource Sharing (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS),
  [Using HTTP cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- **HTTP cache semantics** — [HTTP caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching),
  [ETag (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag)
- **Mini fetch retry/queue** — [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API),
  [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- **Background** — [HTTP request methods (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods),
  [HTTP response status codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)

## Done when

- [ ] `httpPost` sends a JSON body and parses the JSON response.
- [ ] `corsHeaders` echoes an allowed origin and omits `Allow-Origin` for a disallowed one.
- [ ] `conditionalResponse` returns `304` on an ETag match and `200 + ETag` otherwise.
- [ ] `createFetcher` retries a failing request and collapses concurrent same-URL calls into one.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
