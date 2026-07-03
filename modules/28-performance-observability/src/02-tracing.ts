/**
 * Task 2 — Backend tracing (from scratch; concept mirrors OpenTelemetry).
 *
 * A trace is a tree of timed spans that all share one `traceId`. The root span (an HTTP request)
 * has `parentId: null`; each child (a service call, a DB query) points at its parent's `spanId`.
 * The clock + id generator are injected, so durations and ids are deterministic — no wall clock.
 * `exportTrace` flattens the finished tree into one linked trace you could ship to a collector.
 */

/** One span. `endTime`/`durationMs` are null until `endSpan` stamps them off the clock. */
export interface Span {
  spanId: string;
  parentId: string | null;
  traceId: string;
  name: string;
  startTime: number;
  endTime: number | null;
  durationMs: number | null;
}

export interface TracerDeps {
  /** Monotonic clock in ms — injected so span durations are deterministic. */
  clock: () => number;
  /** Deterministic span-id generator (a seq counter, never `Math.random()`). */
  idgen: () => string;
  /** The trace id every span in this request shares. */
  traceId: string;
}

export interface Tracer {
  /** Open a span. Pass its `parent` span to nest it; omit for the root. */
  startSpan(name: string, parent?: Span | null): Span;
  /** Close a span: stamp `endTime`/`durationMs` and record it as finished. */
  endSpan(span: Span): void;
  /** The finished spans, in the order they were closed. */
  finishedSpans(): Span[];
}

/**
 * YOUR TURN — build the tracer:
 *   - Keep a private `finished: Span[]`.
 *   - `startSpan(name, parent)` → return a span with `spanId: idgen()`, `parentId: parent?.spanId ?? null`,
 *     `traceId`, `name`, `startTime: clock()`, `endTime: null`, `durationMs: null`.
 *   - `endSpan(span)` → `const end = clock(); span.endTime = end; span.durationMs = end - span.startTime;`
 *     then push it into `finished`.
 *   - `finishedSpans()` → return a COPY of `finished`.
 */
export function createTracer(_deps: TracerDeps): Tracer {
  throw new Error(
    "TODO: return a tracer whose startSpan/endSpan build a parent→child span tree off the clock",
  );
}

/** One row in a flattened trace. */
export interface FlatSpan {
  spanId: string;
  parentId: string | null;
  name: string;
  durationMs: number;
}

/** A whole trace, flattened: ordered spans + the root id + wall-clock span of the request. */
export interface TraceExport {
  traceId: string;
  rootId: string;
  spans: FlatSpan[];
  totalDurationMs: number;
}

/**
 * YOUR TURN — flatten finished spans into one linked trace:
 *   1. Throw if `spans` is empty; take `traceId` from the first span.
 *   2. Sort a COPY by `startTime`.
 *   3. Find the root (`parentId === null`); throw if there is none.
 *   4. Map to `FlatSpan` rows ({ spanId, parentId, name, durationMs: durationMs ?? 0 }).
 *   5. `totalDurationMs = max(endTime ?? startTime) - min(startTime)`.
 *   6. Return { traceId, rootId, spans, totalDurationMs }.
 */
export function exportTrace(_spans: readonly Span[]): TraceExport {
  throw new Error("TODO: flatten spans into { traceId, rootId, spans, totalDurationMs }");
}
