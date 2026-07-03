/**
 * Task 2 — Middleware (logging + auth + centralized error handling).
 *
 * Three pieces of the middleware chain:
 *   - `requestLogger(sink)` records `{ method, url, status }` into an injected array (the sink) once
 *     the response finishes — so a test asserts on the sink instead of scraping stdout.
 *   - `requireApiKey(key)` short-circuits with `401` when the `x-api-key` header is missing/wrong,
 *     and calls `next()` when it matches.
 *   - `errorHandler` is the 4-arg middleware that maps a thrown `AppError { status, message }` to
 *     that status + `{ error }`, and any unknown throw to `500`. Async throws only reach it if you
 *     forward them — `asyncHandler` wraps a handler so a rejected promise becomes `next(err)`.
 */
import express, {
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

/** Records each request into `sink` after the response is sent (so `res.statusCode` is final). */
export function requestLogger(sink: LogEntry[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      sink.push({ method: req.method, url: req.originalUrl, status: res.statusCode });
    });
    next();
  };
}

/** Gatekeeper: 401 unless the `x-api-key` header matches `expectedKey`, else `next()`. */
export function requireApiKey(expectedKey: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.header("x-api-key") !== expectedKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}

/** Wrap an async handler so a rejected promise is forwarded to the error middleware via `next`. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** The centralized 4-arg error middleware. `AppError` → its status; anything else → 500. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
};

export interface MiddlewareAppDeps {
  sink: LogEntry[];
  apiKey: string;
}

/**
 * Demo app wiring all three together:
 *   - `GET /secret` sits behind `requireApiKey`.
 *   - `GET /boom` throws an `AppError(418, …)` from an async handler (caught by the error mw).
 *   - `GET /crash` throws a plain `Error` (mapped to 500).
 * The error middleware is mounted LAST — registration order is execution order.
 */
export function createMiddlewareApp({ sink, apiKey }: MiddlewareAppDeps): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger(sink));

  app.get("/secret", requireApiKey(apiKey), (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.get(
    "/boom",
    asyncHandler(async () => {
      throw new AppError(418, "I am a teapot");
    }),
  );

  app.get(
    "/crash",
    asyncHandler(async () => {
      throw new Error("unexpected");
    }),
  );

  app.use(errorHandler);
  return app;
}
