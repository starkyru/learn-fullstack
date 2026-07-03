# Module 20b — From-Scratch DataLoader 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Build the batching + caching primitive yourself — no `dataloader` library. You implement the exact
`createDataLoader<K,V>` contract a GraphQL resolver leans on: `load` enqueues a key and returns a
promise, every load in the same tick coalesces into ONE backend call, and a per-key cache dedupes
repeats. Finishing this makes module 20's `DataLoader` import feel like something you already wrote.

## Concepts

- **The batch is a per-tick queue** — `load(key)` does not call the backend; it pushes the key onto a
  queue and, the first time a tick fills, schedules ONE dispatch (via `queueMicrotask`, or an
  injectable `scheduler` so tests can drive the clock). When the dispatch runs, every key collected
  that tick is passed to `batchFn` in a single call.
- **Order + key coalescing** — the batch is dispatched with the DISTINCT keys (first-seen order); each
  caller's promise resolves to the value at its key's index. An `Error` slot rejects only that caller;
  a wrong-length result rejects the whole batch. That index bookkeeping is the whole trick.
- **Cache is Promise fan-out** — a `Map` keyed by `cacheKeyFn(key)` stores the in-flight PROMISE, so a
  repeated key (within or across ticks) reuses it and is never re-fetched; concurrent loads fan out
  from one promise. `clear`/`clearAll` evict, `prime` seeds, and a rejection is evicted so it retries.

## Tasks

| #   | Task                 | Lane | Type | What you build                                    |
| --- | -------------------- | ---- | ---- | ------------------------------------------------- |
| 1   | Batch scheduler      | 🔴   | FS   | collect keys within a tick, dispatch one batch    |
| 2   | Cache + dedupe       | 🔴   | FS   | memoize by key; dedupe concurrent loads           |
| 3   | Wire into a resolver | 🔴   | FS   | drop it into module 20's resolver; match behavior |

## Theory & docs

- **Batch scheduler** — [Using microtasks (MDN microtask guide)](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) ·
  [`queueMicrotask` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask)
- **Cache + dedupe** — [`Map` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) ·
  [`Promise` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- **Wire into a resolver** — [Execution (resolver chains, graphql.org)](https://graphql.org/learn/execution/) ·
  [GraphQL best practices (server-side batching & caching)](https://graphql.org/learn/best-practices/)
- Background — the [dataloader README](https://github.com/graphql/dataloader) is the contract you
  are re-implementing: read it as theory only — the 🔴 lane forbids importing the library.

## Done when

- [ ] N `load`s in one tick call `batchFn` ONCE with the distinct keys; each caller resolves to the
      value at its key's index, an `Error` slot rejects only that caller, and a wrong-length result
      rejects the batch.
- [ ] A repeated key hits the cache — `batchFn` is not called again — and concurrent loads of the same
      key share one promise; `clear`/`clearAll` evict and `prime` seeds without a fetch.
- [ ] It replaces a real DataLoader in a resolver: the loader path and a naive N-call path return
      equal results, but the loader hits the backing fetch once.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
