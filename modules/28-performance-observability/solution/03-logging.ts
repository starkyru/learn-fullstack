/**
 * Task 3 — Structured logging + errors (from scratch; shape mirrors pino + Sentry).
 *
 * A structured logger emits one JSON object per line — `{ level, msg, requestId, …fields }` — so
 * logs are queryable, not grep-able prose. A `child()` logger is the same sink with *merged*
 * context, which is how a `requestId` (and `userId`, `route`, …) rides along automatically. The
 * error-capture wrapper turns a thrown error into both a `logger.error` line and a Sentry-like
 * report carrying the request context. The sink is injected, so tests assert on data, not stdout.
 */

export type Level = "debug" | "info" | "warn" | "error";

/** The shape of one emitted log line once JSON-parsed. */
export interface LogRecord {
  level: Level;
  msg: string;
  requestId: string;
  [key: string]: unknown;
}

export interface LoggerDeps {
  /** Where each JSON line goes (injected — tests collect the strings). */
  sink: (line: string) => void;
  /** The request id stamped on every line from this logger and its children. */
  requestId: string;
  /** Inherited context merged into every line (a child logger adds to this). */
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  /** A new logger with `context` merged onto this one's — same sink + requestId. */
  child(context: Record<string, unknown>): Logger;
  readonly requestId: string;
  readonly context: Record<string, unknown>;
}

export function createLogger(deps: LoggerDeps): Logger {
  const base = deps.context ?? {};

  const emit = (level: Level, msg: string, fields?: Record<string, unknown>): void => {
    const record = {
      level,
      msg,
      requestId: deps.requestId,
      ...base,
      ...(fields ?? {}),
    };
    deps.sink(JSON.stringify(record));
  };

  return {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (context) =>
      createLogger({
        sink: deps.sink,
        requestId: deps.requestId,
        context: { ...base, ...context },
      }),
    requestId: deps.requestId,
    context: base,
  };
}

/** A Sentry-like error sink: capture an exception with structured context. */
export interface ErrorSink {
  captureException(error: unknown, context: Record<string, unknown>): void;
}

export interface CaptureDeps {
  sentry: ErrorSink;
  logger: Logger;
  /** Extra context merged onto the logger's `{ requestId, …context }` for the Sentry report. */
  context?: Record<string, unknown>;
}

/**
 * Run `work`; if it throws, log an `error` line AND report the exception (with the request
 * context) to the Sentry sink, then rethrow. The two halves are "what happened + where".
 */
export function withErrorCapture<T>(work: () => T, deps: CaptureDeps): T {
  try {
    return work();
  } catch (error) {
    const context = {
      requestId: deps.logger.requestId,
      ...deps.logger.context,
      ...(deps.context ?? {}),
    };
    deps.logger.error("unhandled error", {
      error: error instanceof Error ? error.message : String(error),
    });
    deps.sentry.captureException(error, context);
    throw error;
  }
}
