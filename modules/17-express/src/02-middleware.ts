/**
 * Task 2 — Middleware (logging + auth + centralized error handling).
 *
 * Implement the three pieces of the middleware chain. Everything is injected (a log `sink`, the
 * `apiKey`) so tests assert on data, not stdout, and never touch a port.
 */
import {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

/** A typed error a handler can throw; the error middleware turns it into an HTTP response. */
export class AppError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** One recorded request. The logger pushes these into an injected sink. */
export interface LogEntry {
  method: string;
  url: string;
  status: number;
}

/**
 * YOUR TURN — record each request into `sink` AFTER the response is sent:
 *   1. Return `(req, res, next) => { … }`.
 *   2. `res.on("finish", () => sink.push({ method: req.method, url: req.originalUrl, status: res.statusCode }))`
 *      — `finish` fires once the status is final.
 *   3. Call `next()` so the chain continues.
 */
export function requestLogger(_sink: LogEntry[]): RequestHandler {
  throw new Error(
    "TODO: return middleware that pushes {method,url,status} into sink on res 'finish'",
  );
}

/**
 * YOUR TURN — gate a route behind an API key:
 *   1. Return `(req, res, next) => { … }`.
 *   2. If `req.header("x-api-key") !== expectedKey` → `res.status(401).json({ error: "Unauthorized" })` and return.
 *   3. Otherwise call `next()`.
 */
export function requireApiKey(_expectedKey: string): RequestHandler {
  throw new Error(
    "TODO: return middleware that 401s without a matching x-api-key header, else next()",
  );
}

/**
 * YOUR TURN — forward async rejections to the error middleware:
 *   1. Return `(req, res, next) => { fn(req, res, next).catch(next); }`.
 *   (Express 4 does NOT auto-catch async throws; this makes a rejected promise become `next(err)`.)
 */
export function asyncHandler(
  _fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  throw new Error("TODO: return a handler that calls fn(...).catch(next)");
}

/**
 * YOUR TURN — the centralized 4-arg error middleware:
 *   1. If `err instanceof AppError` → `res.status(err.status).json({ error: err.message })` and return.
 *   2. Otherwise → `res.status(500).json({ error: "Internal Server Error" })`.
 */
export const errorHandler: ErrorRequestHandler = (_err, _req, _res, _next) => {
  throw new Error("TODO: map AppError → its status + {error}, everything else → 500");
};

export interface MiddlewareAppDeps {
  sink: LogEntry[];
  apiKey: string;
}

/**
 * YOUR TURN — wire it together:
 *   1. `express()`, `app.use(express.json())`, `app.use(requestLogger(sink))`.
 *   2. `GET /secret` behind `requireApiKey(apiKey)` → 200 `{ ok: true }`.
 *   3. `GET /boom` via `asyncHandler` that throws `new AppError(418, "I am a teapot")`.
 *   4. `GET /crash` via `asyncHandler` that throws `new Error("unexpected")`.
 *   5. `app.use(errorHandler)` LAST, then `return app`.
 */
export function createMiddlewareApp(_deps: MiddlewareAppDeps): Express {
  throw new Error(
    "TODO: wire logger + requireApiKey + /boom + /crash + errorHandler (mounted last)",
  );
}
