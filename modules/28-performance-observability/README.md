# Module 28 — Performance, Observability & Debugging 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Make an app **fast and legible in production**. You model the four pillars from scratch — with no
runtime deps — so the _logic_ is unit-testable even though the real tools (a browser measuring Web
Vitals, an OpenTelemetry collector, `pino` + Sentry, a Redis cache) are irreducibly operational.
Everything is injected — the clock, the id generator, the log/error sink — so a "trace" or a
"TTL expiry" is deterministic: no `Date.now()`, no port, no wall clock.

Each task is the _shape_ of a production tool:

- **Frontend perf** — the code-splitting decision (`splitByRoute` / `splitByBudget`) that shrinks
  the initial chunk, plus `scoreWebVitals` — the exact good/needs-improvement/poor thresholds the
  browser's `web-vitals` library applies to LCP/CLS/INP.
- **Backend tracing** — `startSpan`/`endSpan` build a parent→child span **tree** with an injected
  clock; `exportTrace` flattens it into one linked trace. Concept mirrors OpenTelemetry; no OTel dep.
- **Structured logging + errors** — a request-scoped JSON logger (the shape `pino` emits) whose
  `child()` inherits context, plus an error-capture wrapper that reports to a Sentry-like sink.
- **Caching layer** — a from-scratch LRU **and** per-entry TTL cache, plus a `memoize` wrapper that
  collapses repeated calls to a single backing hit.

## Concepts

- **Code-splitting is a set decision, not magic** — a route either ships in the initial chunk or as
  a lazy chunk. Shrinking Time-to-Interactive means moving routes _out_ of the initial set. The
  bundle estimator makes that trade explicit: `initialKb` is just the sum of the eager routes.
  Web Vitals are then scored against fixed thresholds (LCP `≤2500`ms good / `≤4000` needs; CLS
  `≤0.1` / `≤0.25`; INP `≤200`ms / `≤500`) — the _overall_ rating is the **worst** of the three.
- **A trace is a tree of timed spans sharing one `traceId`** — the root span (HTTP) has
  `parentId: null`; each child (service, DB) points at its parent's `spanId`. `endSpan` stamps a
  duration off the injected clock, so `HTTP ⊃ service ⊃ db` nests deterministically. The exporter
  flattens the tree into one linked list you could ship to a collector.
- **Structured logs are objects, not strings** — every line is `{ level, msg, requestId, …fields }`
  JSON, so it's queryable. A **child logger** is the same sink with merged context, which is how a
  `requestId` (and `userId`, `route`, …) rides along without threading it through every call. An
  error-capture wrapper turns a thrown error into `logger.error` **and** a Sentry report carrying
  that same context — the two halves of "what happened + where".
- **LRU + TTL are two independent eviction rules** — a `Map` preserves insertion order, so the
  **least-recently-used** key is the first key; a `get` re-inserts to mark it recent. TTL is a
  per-entry `expiresAt` checked against the injected clock on read. `memoize` is just this cache
  keyed by the call's arguments — a cache hit skips the backing function entirely.

## Tasks

| #   | Task                        | Lane | Type | What you build                                                       |
| --- | --------------------------- | ---- | ---- | -------------------------------------------------------------------- |
| 1   | Frontend perf               | 🟢   | WE   | solved bundle-split fix + analog lazy-route stub; measure Web Vitals |
| 2   | Backend tracing             | 🟡   | TODO | OpenTelemetry spans across HTTP→service→DB; view a trace             |
| 3   | Structured logging + errors | 🟢   | TODO | a request-scoped pino logger + Sentry error capture                  |
| 4   | Caching layer               | 🔴   | FS   | an in-memory LRU + TTL cache for a hot query — from scratch          |

## Done when

- [ ] `estimateBundle` sums the eager routes into `initialKb`; `splitByRoute` (solved) and the
      analog `splitByBudget` both **shrink the initial-chunk set**. `scoreWebVitals` returns the
      right rating at every exact boundary and an `overall` = the worst metric.
- [ ] One request yields **one linked trace**: `finishedSpans()` share a `traceId`, exactly one has
      `parentId: null`, each child references its parent's `spanId`, and durations come off the
      injected clock. `exportTrace` reports the root id + total duration.
- [ ] `createLogger` emits `{ level, msg, requestId, …fields }` JSON; `child()` inherits context;
      `withErrorCapture` reports the thrown error **and** the request context to the Sentry sink and
      rethrows.
- [ ] The cache **evicts the least-recently-used key** at `max`, a `get` refreshes recency, entries
      **expire by the clock** at their TTL, and `memoize` collapses repeated calls to one backing hit.

> **Worked example (WE):** task 1's `estimateBundle` / `splitByRoute` / `scoreWebVitals` are solved
> in **both** `src/` and `solution/`; the analog `splitByBudget` throws `TODO` in `src/` — implement
> it by mirroring the split fix. **TODO** tasks (2, 3) throw in `src/`; keep the signature + return
> shape and implement the body. **From scratch (FS):** task 4's `src/` throws `TODO` — build the
> cache. Tests import from `solution/`; point them at `../src/...` to grade your own build.
