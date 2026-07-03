/**
 * A framework-agnostic `requireSession` guard over a minimal request shape (`{ method, headers }`).
 *
 * YOUR TURN — implement `requireSession(options)` → `(req) => AuthContext`:
 *   1. Parse the `Cookie` header; read the session cookie. Missing/empty → throw HttpError(401).
 *   2. `manager.validateSession(token)`; null → throw HttpError(401).
 *   3. For UNSAFE methods (not GET/HEAD/OPTIONS): compose `verifyCsrf` (cookie token vs the CSRF
 *      header, plus origin/referer allowlist); failure → throw HttpError(403).
 *   4. If the session rotated, push a refreshed `serializeSessionCookie` into `setCookies`.
 *   5. Return { session, setCookies }.
 */

import type { SameSite, SessionManager, ValidatedSession } from "./01-session.js";

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
  setCookies: string[];
}

export function requireSession(
  _options: MiddlewareOptions,
): (req: RequestLike) => AuthContext {
  throw new Error(
    "TODO: validate the session cookie (401), compose CSRF for unsafe methods (403), re-issue on rotation",
  );
}
