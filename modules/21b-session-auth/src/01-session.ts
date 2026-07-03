/**
 * A Lucia-shaped session manager, from scratch — no auth library. The security is in the details:
 * hash tokens at rest, compare in constant time, expire on idle + absolute deadlines, and rotate.
 *
 * YOUR TURN — implement the functions below (keep the signatures/return shapes):
 *   - hashToken(token): return `sha256(token)` as base64url (this is all the store ever holds).
 *   - constantTimeEqual(a, b): guard length, then `crypto.timingSafeEqual` — never `===` a secret.
 *   - createSessionManager(store, { now, generateToken, ttl }):
 *       1. createSession(userId): mint a raw token (default `randomBytes(32)` base64url), store only
 *          its hash, set `expiresAt = createdAt + min(idleMs, absoluteMs)`; return { token, record }.
 *       2. validateSession(token): hash → look up → constant-time confirm; return null past the
 *          absolute cap OR the idle deadline (delete it); ROTATE within `renewMs` of the idle
 *          deadline (new token, delete old hash, preserve createdAt); else return { token, record,
 *          rotated: false }.
 *       3. invalidateSession(token): delete `hashToken(token)`.
 *   - serializeSessionCookie(name, value, opts): `HttpOnly; Secure; SameSite=Lax; Path=/` +
 *     `Max-Age`/`Expires` from `expiresAt` (inject `now`).
 *   - parseCookies(header): split `a=b; c=d` into a map.
 *   - signValue / verifySignedValue: HMAC(secret) sign, constant-time verify.
 */

// --- primitives --------------------------------------------------------------------------------

export function hashToken(_token: string): string {
  throw new Error("TODO: return sha256(token) as base64url");
}

export function constantTimeEqual(_a: string, _b: string): boolean {
  throw new Error(
    "TODO: length-guard then crypto.timingSafeEqual (no early-return === compare)",
  );
}

// --- session store -----------------------------------------------------------------------------

export interface SessionRecord {
  hashedToken: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface SessionStore {
  set(hashedToken: string, record: SessionRecord): void;
  get(hashedToken: string): SessionRecord | undefined;
  delete(hashedToken: string): void;
}

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
  idleMs: number;
  absoluteMs: number;
  renewMs: number;
}

export interface SessionManagerOptions {
  now?: () => number;
  generateToken?: () => string;
  ttl: SessionTtl;
}

export interface IssuedSession {
  token: string;
  record: SessionRecord;
}

export interface ValidatedSession {
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
  _store: SessionStore,
  _options: SessionManagerOptions,
): SessionManager {
  throw new Error(
    "TODO: build createSession/validateSession/invalidateSession (hash at rest, expire, rotate)",
  );
}

// --- cookies -----------------------------------------------------------------------------------

export type SameSite = "Lax" | "Strict" | "None";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  path?: string;
  expiresAt?: number;
  now?: () => number;
}

export function serializeSessionCookie(
  _name: string,
  _value: string,
  _options: CookieOptions = {},
): string {
  throw new Error("TODO: emit HttpOnly; Secure; SameSite; Path; Max-Age/Expires");
}

export function parseCookies(_header: string | undefined): Record<string, string> {
  throw new Error("TODO: parse `a=b; c=d` into a map");
}

// --- signed cookies ----------------------------------------------------------------------------

export function signValue(_value: string, _secret: string): string {
  throw new Error("TODO: return `value.hmac` (HMAC-SHA256 base64url)");
}

export function verifySignedValue(_signed: string, _secret: string): string | null {
  throw new Error("TODO: constant-time HMAC verify; return value or null");
}
