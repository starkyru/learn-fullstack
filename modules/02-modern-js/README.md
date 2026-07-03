# Module 02 — Modern JavaScript & Async

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The language and async model that React and Node both sit on: promises, the microtask vs
macrotask queues, async iteration, and bounded concurrency.

## Concepts

- **Promises & async/await** — `async` functions return promises; `await` suspends without
  blocking the thread. Combinators: `Promise.all`/`allSettled`/`race`.
- **The event loop** — synchronous code runs first; then the **microtask** queue (resolved
  promises, `queueMicrotask`) drains fully; then one **macrotask** (`setTimeout`) runs, and
  the cycle repeats. Ordering bugs come from misjudging this.
- **Async iterators / generators** — `async function*` + `for await…of` model a stream of
  values you pull on demand (pagination, event streams).
- **Bounded concurrency** — firing 10 000 requests at once melts a server; a concurrency
  limiter keeps N in flight.

## Tasks

| #   | Task                   | Lane | Type | What you build                                                        |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Promises & async/await | 🟢   | WE   | solved `retry()` + analog `withTimeout()` stub (races a timeout)      |
| 2   | Event-loop ordering    | 🟡   | TODO | `orderedEffects()` that emits `sync → microtask → macrotask` in order |
| 3   | Async iterators        | 🔴   | FS   | `paginate()` — an async generator over a paged API, no library        |
| 4   | Concurrency control    | 🟡   | TODO | `pMap(items, fn, {concurrency})` — a mini p-limit                     |

## Theory & docs

- **Promises & async/await** — [Using promises (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises),
  [async function (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- **Event-loop ordering** — [The event loop (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model),
  [Using microtasks (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- **Async iterators** — [for await...of (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of),
  [Iteration protocols (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- **Concurrency control** — [Promise.all() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all),
  [Promise.allSettled() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)

## Done when

- [ ] `retry` retries on failure with backoff; `withTimeout` rejects a slow promise.
- [ ] `orderedEffects()` resolves to `["sync", "microtask", "macrotask"]`.
- [ ] `paginate` yields every item across pages via `for await…of`.
- [ ] `pMap` preserves input order and never exceeds the concurrency cap.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
