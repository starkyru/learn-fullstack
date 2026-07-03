# Module 04 — Node.js Fundamentals

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Node's runtime: the module system, HTTP without a framework, streams with backpressure, a
typed event bus, and the filesystem — the primitives NestJS and the chat gateway are built on.

## Concepts

- **`node:http`** — a server is a function `(req, res)`; you route on `req.method` + `req.url`.
- **Streams & backpressure** — `Readable → Transform → Writable`; when a consumer is slow,
  `.pipe()` pauses the source so memory doesn't blow up. This is how you move large files.
- **`EventEmitter`** — the pub/sub primitive under sockets, streams, and the process itself;
  make it type-safe so events and payloads can't drift.
- **`fs/promises`** — async file I/O for a simple on-disk cache.

## Tasks

| #   | Task                         | Lane | Type | What you build                                                   |
| --- | ---------------------------- | ---- | ---- | ---------------------------------------------------------------- |
| 1   | HTTP server from `node:http` | 🟢   | WE   | solved `route()` handler + analog second-route stub (no Express) |
| 2   | Streams & backpressure       | 🔴   | FS   | an uppercase `Transform` stream; pipe a source through it        |
| 3   | Typed EventEmitter           | 🟡   | TODO | a `TypedEmitter<Events>` with typed `on`/`emit`                  |
| 4   | File-based cache             | 🟢   | TODO | a `FileCache` (get/set) with TTL over `fs/promises`              |

## Theory & docs

- **HTTP server from `node:http`** — [HTTP (Node.js API)](https://nodejs.org/api/http.html),
  [Anatomy of an HTTP transaction (Node.js)](https://nodejs.org/en/learn/modules/anatomy-of-an-http-transaction)
- **Streams & backpressure** — [Stream (Node.js API)](https://nodejs.org/api/stream.html),
  [Backpressuring in streams (Node.js)](https://nodejs.org/en/learn/modules/backpressuring-in-streams)
- **Typed EventEmitter** — [Events (Node.js API)](https://nodejs.org/api/events.html),
  [The Node.js event emitter (Node.js)](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter)
- **File-based cache** — [File system (Node.js API)](https://nodejs.org/api/fs.html),
  [Writing files with Node.js](https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs)

## Done when

- [ ] `route()` returns the right status/body per method+path; the analog route works too.
- [ ] the transform stream uppercases piped chunks and the output is reassembled in order.
- [ ] `TypedEmitter` calls handlers with the correctly typed payload.
- [ ] `FileCache` returns a fresh value, `undefined` after the TTL elapses.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
