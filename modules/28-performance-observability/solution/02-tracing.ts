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

export function createTracer(deps: TracerDeps): Tracer {
  const finished: Span[] = [];
  return {
    startSpan(name, parent) {
      return {
        spanId: deps.idgen(),
        parentId: parent ? parent.spanId : null,
        traceId: deps.traceId,
        name,
        startTime: deps.clock(),
        endTime: null,
        durationMs: null,
      };
    },
    endSpan(span) {
      const end = deps.clock();
      span.endTime = end;
      span.durationMs = end - span.startTime;
      finished.push(span);
    },
    finishedSpans() {
      return [...finished];
    },
  };
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
 * Flatten finished spans into one linked trace, sorted by `startTime`. Throws if the spans are
 * empty or have no root (a span with `parentId: null`).
 */
export function exportTrace(spans: readonly Span[]): TraceExport {
  const first = spans[0];
  if (!first) throw new Error("cannot export an empty trace");
  const traceId = first.traceId;

  const sorted = [...spans].sort((a, b) => a.startTime - b.startTime);
  const root = sorted.find((s) => s.parentId === null);
  if (!root) throw new Error("trace has no root span");

  const flat: FlatSpan[] = sorted.map((s) => ({
    spanId: s.spanId,
    parentId: s.parentId,
    name: s.name,
    durationMs: s.durationMs ?? 0,
  }));

  const minStart = Math.min(...spans.map((s) => s.startTime));
  const maxEnd = Math.max(...spans.map((s) => s.endTime ?? s.startTime));
  return {
    traceId,
    rootId: root.spanId,
    spans: flat,
    totalDurationMs: maxEnd - minStart,
  };
}
