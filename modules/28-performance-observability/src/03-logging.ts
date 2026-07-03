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

/**
 * YOUR TURN — build the logger:
 *   - `base = deps.context ?? {}`.
 *   - An `emit(level, msg, fields?)` helper builds `{ level, msg, requestId: deps.requestId, ...base,
 *     ...(fields ?? {}) }` and calls `deps.sink(JSON.stringify(record))`.
 *   - `debug/info/warn/error` delegate to `emit` with their level.
 *   - `child(context)` → `createLogger({ sink, requestId, context: { ...base, ...context } })`.
 *   - Expose `requestId` and `context: base`.
 */
export function createLogger(_deps: LoggerDeps): Logger {
  throw new Error(
    "TODO: return a logger emitting { level, msg, requestId, ...context, ...fields } JSON lines",
  );
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
 * YOUR TURN — run `work`; on a throw:
 *   1. Build `context = { requestId: logger.requestId, ...logger.context, ...(deps.context ?? {}) }`.
 *   2. `logger.error("unhandled error", { error: err instanceof Error ? err.message : String(err) })`.
 *   3. `sentry.captureException(err, context)`.
 *   4. Rethrow the original error.
 */
export function withErrorCapture<T>(_work: () => T, _deps: CaptureDeps): T {
  throw new Error(
    "TODO: log + report the thrown error with request context, then rethrow",
  );
}
