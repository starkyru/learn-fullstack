import { describe, expect, it } from "vitest";
import { createTracer, exportTrace, type Span } from "../solution/02-tracing.js";

/** A clock that returns each queued timestamp on successive calls. */
function stepClock(times: readonly number[]): () => number {
  let i = 0;
  return () => times[i++] ?? times[times.length - 1] ?? 0;
}

/** A deterministic seq id generator: `span-1`, `span-2`, … */
function seqIds(prefix: string): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/**
 * Simulate one request: HTTP root ⊃ service ⊃ db, closed inside-out.
 * clock() calls in order: root.start=0, service.start=1, db.start=2,
 *                         db.end=5, service.end=7, root.end=10.
 */
function traceOneRequest(): Span[] {
  const tracer = createTracer({
    clock: stepClock([0, 1, 2, 5, 7, 10]),
    idgen: seqIds("span"),
    traceId: "trace-abc",
  });
  const http = tracer.startSpan("GET /orders");
  const service = tracer.startSpan("OrderService.load", http);
  const db = tracer.startSpan("db.query", service);
  tracer.endSpan(db);
  tracer.endSpan(service);
  tracer.endSpan(http);
  return tracer.finishedSpans();
}

describe("createTracer", () => {
  it("yields one linked trace: shared traceId, exactly one root, children point at parents", () => {
    const spans = traceOneRequest();
    expect(spans.map((s) => s.spanId)).toEqual(["span-3", "span-2", "span-1"]);
    expect(new Set(spans.map((s) => s.traceId))).toEqual(new Set(["trace-abc"]));

    const roots = spans.filter((s) => s.parentId === null);
    expect(roots).toHaveLength(1);
    expect(roots[0]?.name).toBe("GET /orders");

    const byName = new Map(spans.map((s) => [s.name, s]));
    expect(byName.get("OrderService.load")?.parentId).toBe(
      byName.get("GET /orders")?.spanId,
    );
    expect(byName.get("db.query")?.parentId).toBe(
      byName.get("OrderService.load")?.spanId,
    );
  });

  it("stamps durations off the injected clock (nested spans nest in time)", () => {
    const spans = traceOneRequest();
    const byName = new Map(spans.map((s) => [s.name, s]));
    expect(byName.get("db.query")?.durationMs).toBe(3); // 5 - 2
    expect(byName.get("OrderService.load")?.durationMs).toBe(6); // 7 - 1
    expect(byName.get("GET /orders")?.durationMs).toBe(10); // 10 - 0
  });

  it("finishedSpans() returns a copy — mutating it leaves internal state untouched", () => {
    const tracer = createTracer({
      clock: stepClock([0, 5]),
      idgen: seqIds("span"),
      traceId: "trace-copy",
    });
    const root = tracer.startSpan("root");
    tracer.endSpan(root);

    const first = tracer.finishedSpans();
    expect(first.map((s) => s.spanId)).toEqual(["span-1"]);
    first.pop(); // mutate the returned array; if it were the live array this drains internal state

    // Internal state must be unaffected — dies to `finishedSpans() { return finished; }`.
    expect(tracer.finishedSpans().map((s) => s.spanId)).toEqual(["span-1"]);
  });
});

describe("exportTrace", () => {
  it("flattens the tree into one trace sorted by startTime with the root id + total duration", () => {
    const out = exportTrace(traceOneRequest());
    expect(out.traceId).toBe("trace-abc");
    expect(out.rootId).toBe("span-1");
    expect(out.totalDurationMs).toBe(10); // max end 10 - min start 0
    expect(out.spans).toEqual([
      { spanId: "span-1", parentId: null, name: "GET /orders", durationMs: 10 },
      { spanId: "span-2", parentId: "span-1", name: "OrderService.load", durationMs: 6 },
      { spanId: "span-3", parentId: "span-2", name: "db.query", durationMs: 3 },
    ]);
  });

  it("throws on an empty trace", () => {
    expect(() => exportTrace([])).toThrow();
  });

  it("throws when spans exist but none is a root (every span has a parent)", () => {
    // A non-empty trace whose only span points at a (missing) parent → no `parentId: null`.
    const orphan: Span = {
      spanId: "span-2",
      parentId: "span-1",
      traceId: "trace-abc",
      name: "OrderService.load",
      startTime: 1,
      endTime: 7,
      durationMs: 6,
    };
    // Exact message — dies to deleting the no-root guard (which would then throw a TypeError
    // on `root.spanId` instead of this domain error).
    expect(() => exportTrace([orphan])).toThrow("trace has no root span");
  });

  it("totalDurationMs spans min-start..max-end even when a child outlives the root", () => {
    // Root: start 0, end 8 (durationMs 8). Child: start 1, end 12 — ends AFTER the root.
    // clock() order: root.start=0, child.start=1, root.end=8, child.end=12.
    const tracer = createTracer({
      clock: stepClock([0, 1, 8, 12]),
      idgen: seqIds("span"),
      traceId: "trace-xyz",
    });
    const root = tracer.startSpan("GET /orders");
    const child = tracer.startSpan("OrderService.load", root);
    tracer.endSpan(root);
    tracer.endSpan(child);

    const out = exportTrace(tracer.finishedSpans());
    expect(root.durationMs).toBe(8); // the root's OWN duration
    // max end (12) - min start (0) = 12, which differs from the root's 8 → dies to
    // `totalDurationMs: root.durationMs ?? 0`.
    expect(out.totalDurationMs).toBe(12);
  });
});
