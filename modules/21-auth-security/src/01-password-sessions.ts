/**
 * Task 1 — Password + sessions (WORKED EXAMPLE).
 *
 * `hashPassword` / `verifyPassword` / `login` below are the fully-solved reference: a **salted,
 * slow** bcrypt hash (the module's stand-in for argon2/bcrypt) plus a **server-side session**
 * minted from an INJECTED id + clock. The raw password is never stored; the browser only holds the
 * opaque session id. Read them — then do YOUR TURN: implement the analog `logout` (revoke a
 * session) and `rotateSession` (mint a fresh id for the same user, invalidate the old one — the
 * defense against session fixation).
 */
import bcrypt from "bcryptjs";

export interface StoredUser {
  id: string;
  username: string;
  /** bcrypt digest of the password — never the raw password. */
  passwordHash: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
}

/** Injected monotonic clock (ms since epoch) — never `Date.now()`. */
export interface Clock {
  now(): number;
}

/** Injected opaque id source — never `Math.random()`/`crypto.randomUUID()` inline. */
export interface IdSource {
  next(): string;
}

/** The server-side session table: opaque id → session record. */
export type SessionStore = Map<string, Session>;

/** Default bcrypt work factor. Higher = slower = more brute-force-resistant. */
export const DEFAULT_COST = 10;

/** Hash a password with a per-call random salt at the given cost. */
export function hashPassword(password: string, cost: number = DEFAULT_COST): string {
  const salt = bcrypt.genSaltSync(cost);
  return bcrypt.hashSync(password, salt);
}

/** Constant-time verify: `true` only for the exact password that produced `hash`. */
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Verify credentials and, on success, create + store a server session. Returns the session on
 * success and `null` on a bad username or password (same shape either way — no user enumeration).
 */
export function login(
  users: Map<string, StoredUser>,
  store: SessionStore,
  username: string,
  password: string,
  deps: { ids: IdSource; clock: Clock },
): Session | null {
  const user = users.get(username);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  const session: Session = {
    id: deps.ids.next(),
    userId: user.id,
    createdAt: deps.clock.now(),
  };
  store.set(session.id, session);
  return session;
}

/* ─────────────────────────── YOUR TURN: revoke + rotate ───────────────────────────
 *
 * `logout` should remove the session under `sessionId` and report whether one existed.
 * `rotateSession` should look the old session up, delete it, and store a NEW session with a fresh
 * `ids.next()` id + `clock.now()` timestamp for the SAME `userId` (return `null` for an unknown
 * old id). Both THROW until you implement them. */

/** Revoke a session immediately. Returns `true` if a session was actually removed. */
export function logout(_store: SessionStore, _sessionId: string): boolean {
  throw new Error(
    "TODO: delete the session from the store and return whether it existed",
  );
}

/**
 * Rotate a session: mint a fresh id for the same user and invalidate the old one (defends against
 * session fixation). Returns the new session, or `null` if the old id was unknown.
 */
export function rotateSession(
  _store: SessionStore,
  _oldId: string,
  _deps: { ids: IdSource; clock: Clock },
): Session | null {
  throw new Error(
    "TODO: look up the old session, delete it, store + return a new session (same userId)",
  );
}
