/**
 * A framework-agnostic `requireSession` guard. It works off a minimal request shape
 * (`{ method, headers }`), so it drops into Express/Next/Hono/etc. by wiring their
 * cookie/header/response abstractions to these plain fields.
 *
 *   - Reads the session cookie, validates it, and THROWS `HttpError(401)` when missing/invalid.
 *   - For UNSAFE methods (anything but GET/HEAD/OPTIONS) it composes the CSRF check and throws
 *     `HttpError(403)` on failure.
 *   - When `validateSession` rotated the token, it returns a refreshed `Set-Cookie` string so the
 *     caller can re-issue the cookie.
 */

import { parseCookies, serializeSessionCookie, type SameSite } from "./01-session.js";
import type { SessionManager, ValidatedSession } from "./01-session.js";
import { verifyCsrf } from "./02-csrf.js";

/** Methods that don't mutate state and so skip the CSRF check. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export interface RequestLike {
  method: string;
  /** Lowercased header names → value (as Node delivers them). */
  headers: Record<string, string | undefined>;
}

export interface MiddlewareOptions {
  manager: SessionManager;
  cookieName?: string;
  now?: () => number;
  cookie?: { secure?: boolean; sameSite?: SameSite; path?: string };
  csrf?: {
    cookieName?: string;
    headerName?: string;
    allowedOrigins: string[];
  };
}

export interface AuthContext {
  session: ValidatedSession;
  /** `Set-Cookie` values to write back (populated when the session rotated). */
  setCookies: string[];
}

export function requireSession(
  options: MiddlewareOptions,
): (req: RequestLike) => AuthContext {
  const cookieName = options.cookieName ?? "session";
  const csrfCookieName = options.csrf?.cookieName ?? "csrf";
  const csrfHeaderName = (options.csrf?.headerName ?? "x-csrf-token").toLowerCase();
  const now = options.now ?? Date.now;

  return function guard(req: RequestLike): AuthContext {
    const cookies = parseCookies(req.headers["cookie"]);

    const token = cookies[cookieName];
    if (token === undefined || token === "") {
      throw new HttpError(401, "missing session cookie");
    }

    const session = options.manager.validateSession(token);
    if (session === null) {
      throw new HttpError(401, "invalid session");
    }

    // Unsafe methods must pass CSRF (double-submit + origin).
    if (!SAFE_METHODS.has(req.method.toUpperCase())) {
      if (options.csrf === undefined) {
        throw new HttpError(403, "csrf protection not configured");
      }
      const ok = verifyCsrf({
        cookieToken: cookies[csrfCookieName],
        submittedToken: req.headers[csrfHeaderName],
        origin: req.headers["origin"],
        referer: req.headers["referer"],
        allowedOrigins: options.csrf.allowedOrigins,
      });
      if (!ok) throw new HttpError(403, "csrf validation failed");
    }

    const setCookies: string[] = [];
    if (session.rotated) {
      setCookies.push(
        serializeSessionCookie(cookieName, session.token, {
          expiresAt: session.record.expiresAt,
          now,
          secure: options.cookie?.secure ?? true,
          sameSite: options.cookie?.sameSite ?? "Lax",
          path: options.cookie?.path ?? "/",
        }),
      );
    }

    return { session, setCookies };
  };
}
