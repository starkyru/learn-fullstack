import { describe, expect, it, vi } from "vitest";
import {
  createLogger,
  withErrorCapture,
  type ErrorSink,
  type LogRecord,
} from "../solution/03-logging.js";

/** Collect emitted lines and expose them parsed back to objects. */
function collectingSink() {
  const lines: string[] = [];
  return {
    sink: (line: string) => lines.push(line),
    records: (): LogRecord[] => lines.map((l) => JSON.parse(l) as LogRecord),
  };
}

describe("createLogger", () => {
  it("emits a JSON line with exactly { level, msg, requestId }", () => {
    const { sink, records } = collectingSink();
    createLogger({ sink, requestId: "req-1" }).info("started");
    expect(records()).toEqual([{ level: "info", msg: "started", requestId: "req-1" }]);
  });

  it("merges per-call fields and reflects the level", () => {
    const { sink, records } = collectingSink();
    createLogger({ sink, requestId: "req-1" }).warn("slow query", { ms: 812 });
    expect(records()).toEqual([
      { level: "warn", msg: "slow query", requestId: "req-1", ms: 812 },
    ]);
  });

  it("child loggers inherit and extend context", () => {
    const { sink, records } = collectingSink();
    const base = createLogger({ sink, requestId: "req-1", context: { service: "api" } });
    base.child({ route: "/orders" }).info("handled", { status: 200 });
    expect(records()).toEqual([
      {
        level: "info",
        msg: "handled",
        requestId: "req-1",
        service: "api",
        route: "/orders",
        status: 200,
      },
    ]);
  });
});

describe("withErrorCapture", () => {
  it("reports the thrown error + request context to Sentry, logs it, and rethrows", () => {
    const { sink, records } = collectingSink();
    const logger = createLogger({ sink, requestId: "req-9", context: { userId: "u-7" } });
    const captured: Array<{ error: unknown; context: Record<string, unknown> }> = [];
    const sentry: ErrorSink = {
      captureException: (error, context) => captured.push({ error, context }),
    };
    const boom = new Error("db down");

    expect(() =>
      withErrorCapture(
        () => {
          throw boom;
        },
        { sentry, logger, context: { op: "loadOrders" } },
      ),
    ).toThrow(boom);

    expect(captured).toEqual([
      { error: boom, context: { requestId: "req-9", userId: "u-7", op: "loadOrders" } },
    ]);
    expect(records()).toEqual([
      {
        level: "error",
        msg: "unhandled error",
        requestId: "req-9",
        userId: "u-7",
        error: "db down",
      },
    ]);
  });

  it("returns the value and never touches Sentry when work succeeds", () => {
    const { sink } = collectingSink();
    const logger = createLogger({ sink, requestId: "req-2" });
    const capture = vi.fn();
    const sentry: ErrorSink = { captureException: capture };
    const result = withErrorCapture(() => 42, { sentry, logger });
    expect(result).toBe(42);
    expect(capture).not.toHaveBeenCalled();
  });
});
