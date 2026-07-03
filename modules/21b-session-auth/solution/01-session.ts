/**
 * A Lucia-shaped session manager, from scratch — no auth library. The security lives in a few
 * disciplined choices:
 *
 *   - The RAW token (what the browser holds) is high-entropy `randomBytes(32)` in base64url. The
 *     store only ever holds `sha256(token)` — a leaked store reveals no usable credential.
 *   - `validateSession` hashes the presented token, looks it up, and confirms the stored hash with a
 *     CONSTANT-TIME compare (never `===` on a secret).
 *   - Sessions carry an idle deadline (slides) and an absolute cap (fixed). Past either → `null`.
 *     Near the idle deadline they ROTATE: a fresh token id is minted and the old hash deleted, so a
 *     stale stolen cookie stops working once the real user refreshes.
 *
 * Randomness and the clock are INJECTED (defaulting to `crypto.randomBytes` / `Date.now`) so tests
 * are deterministic.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// --- primitives --------------------------------------------------------------------------------

/** SHA-256 of a token → base64url. This (never the raw token) is what the store persists. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

/** Timing-safe string compare: guard length first (differing lengths can't be equal), then `timingSafeEqual`. */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

// --- session store -----------------------------------------------------------------------------

export interface SessionRecord {
  /** `sha256(rawToken)` — the persisted lookup key, never the raw token. */
  hashedToken: string;
  userId: string;
  /** Fixed at creation; drives the absolute expiry cap. */
  createdAt: number;
  /** Idle deadline; refreshed on rotation. */
  expiresAt: number;
}

export interface SessionStore {
  set(hashedToken: string, record: SessionRecord): void;
  get(hashedToken: string): SessionRecord | undefined;
  delete(hashedToken: string): void;
}

/** An in-memory `SessionStore` (the fake a test injects, and a stand-in where no DB is wired up). */
export function createMemorySessionStore(): SessionStore {
  const map = new Map<string, SessionRecord>();
  return {
    set: (hashedToken, record) => {
      map.set(hashedToken, record);
    },
    get: (hashedToken) => map.get(hashedToken),
    delete: (hashedToken) => {
      map.delete(hashedToken);
    },
  };
}

// --- manager -----------------------------------------------------------------------------------

export interface SessionTtl {
  /** Idle timeout: expiry slides this far past the last activity. */
  idleMs: number;
  /** Absolute cap: a session can never outlive `createdAt + absoluteMs`, however active. */
  absoluteMs: number;
  /** Rotate when the clock is within this window of the idle deadline. `0` disables rotation. */
  renewMs: number;
}

export interface SessionManagerOptions {
  now?: () => number;
  generateToken?: () => string;
  ttl: SessionTtl;
}

export interface IssuedSession {
  /** The raw token to hand the client (in a cookie). Never stored server-side. */
  token: string;
  record: SessionRecord;
}

export interface ValidatedSession {
  /** The current raw token — a fresh one if `rotated`, otherwise the presented token. */
  token: string;
  record: SessionRecord;
  rotated: boolean;
}

export interface SessionManager {
  createSession(userId: string): IssuedSession;
  validateSession(token: string): ValidatedSession | null;
  invalidateSession(token: string): void;
}

export function createSessionManager(
  store: SessionStore,
  options: SessionManagerOptions,
): SessionManager {
  const now = options.now ?? Date.now;
  const generateToken =
    options.generateToken ?? (() => randomBytes(32).toString("base64url"));
  const { idleMs, absoluteMs, renewMs } = options.ttl;

  function createSession(userId: string): IssuedSession {
    const token = generateToken();
    const hashedToken = hashToken(token);
    const createdAt = now();
    const record: SessionRecord = {
      hashedToken,
      userId,
      createdAt,
      // Never let the idle deadline exceed the absolute cap.
      expiresAt: createdAt + Math.min(idleMs, absoluteMs),
    };
    store.set(hashedToken, record);
    return { token, record };
  }

  function validateSession(token: string): ValidatedSession | null {
    const hashedToken = hashToken(token);
    const record = store.get(hashedToken);
    if (record === undefined) return null;
    // Constant-time confirm the stored hash — defense-in-depth against store key confusion.
    if (!constantTimeEqual(record.hashedToken, hashedToken)) return null;

    const current = now();
    // Absolute cap: fixed from creation, cannot be slid.
    if (current >= record.createdAt + absoluteMs) {
      store.delete(hashedToken);
      return null;
    }
    // Idle expiry.
    if (current >= record.expiresAt) {
      store.delete(hashedToken);
      return null;
    }

    // Near the idle deadline → rotate: mint a fresh id, drop the old hash.
    if (renewMs > 0 && current >= record.expiresAt - renewMs) {
      store.delete(hashedToken);
      const newToken = generateToken();
      const newHashed = hashToken(newToken);
      const newRecord: SessionRecord = {
        hashedToken: newHashed,
        userId: record.userId,
        createdAt: record.createdAt, // preserve the absolute cap
        expiresAt: Math.min(current + idleMs, record.createdAt + absoluteMs),
      };
      store.set(newHashed, newRecord);
      return { token: newToken, record: newRecord, rotated: true };
    }

    return { token, record, rotated: false };
  }

  function invalidateSession(token: string): void {
    store.delete(hashToken(token));
  }

  return { createSession, validateSession, invalidateSession };
}

// --- cookies -----------------------------------------------------------------------------------

export type SameSite = "Lax" | "Strict" | "None";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  path?: string;
  /** Session expiry (ms epoch) → `Max-Age`/`Expires`. Omit for a session cookie. */
  expiresAt?: number;
  now?: () => number;
}

/**
 * Serialize a hardened `Set-Cookie` value: `HttpOnly` (no JS access), `Secure` (HTTPS only),
 * `SameSite=Lax` (configurable), `Path=/`, and `Max-Age`/`Expires` derived from the session expiry.
 */
export function serializeSessionCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.httpOnly ?? true) parts.push("HttpOnly");
  if (options.secure ?? true) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  if (options.expiresAt !== undefined) {
    const nowFn = options.now ?? Date.now;
    const maxAge = Math.max(0, Math.floor((options.expiresAt - nowFn()) / 1000));
    parts.push(`Max-Age=${maxAge}`);
    parts.push(`Expires=${new Date(options.expiresAt).toUTCString()}`);
  }
  return parts.join("; ");
}

/** Parse a `Cookie:` header (`a=b; c=d`) into a map. Later duplicates win. */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (header === undefined || header === "") return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key !== "") out[key] = val;
  }
  return out;
}

// --- signed cookies ----------------------------------------------------------------------------

/** Sign a value with `HMAC-SHA256(secret)` → `value.signature` (base64url). */
export function signValue(value: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${sig}`;
}

/** Verify a signed value with a CONSTANT-TIME HMAC compare; returns the value, or `null` if tampered. */
export function verifySignedValue(signed: string, secret: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(value).digest("base64url");
  if (!constantTimeEqual(sig, expected)) return null;
  return value;
}
