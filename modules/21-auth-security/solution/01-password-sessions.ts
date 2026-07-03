/**
 * Task 1 — Password + sessions (SOLUTION).
 *
 * The oldest, still-correct auth: a **salted, slow** password hash + a **server-side session**.
 *   - `hashPassword` / `verifyPassword` wrap bcrypt (the module's stand-in for argon2/bcrypt): a
 *     per-password random salt baked into the digest, a work factor that keeps brute force slow, and
 *     a constant-time `compare`. The raw password is NEVER stored — only the digest.
 *   - `login` looks a user up, verifies the password, and on success mints a **server session**
 *     (an opaque id → `{ userId, createdAt }` record in a store). The browser only ever holds the
 *     opaque id; all trust lives server-side, so `logout` / `rotateSession` can revoke instantly.
 *
 * Every non-deterministic input is INJECTED — the session id (`ids`) and the timestamp (`clock`) —
 * so the flow is reproducible in a test (bcrypt's own CSPRNG salt is a real security property, not
 * asserted for an exact value).
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

/** Revoke a session immediately. Returns `true` if a session was actually removed. */
export function logout(store: SessionStore, sessionId: string): boolean {
  return store.delete(sessionId);
}

/**
 * Rotate a session: mint a fresh id for the same user and invalidate the old one (defends against
 * session fixation). Returns the new session, or `null` if the old id was unknown.
 */
export function rotateSession(
  store: SessionStore,
  oldId: string,
  deps: { ids: IdSource; clock: Clock },
): Session | null {
  const existing = store.get(oldId);
  if (!existing) return null;

  store.delete(oldId);
  const rotated: Session = {
    id: deps.ids.next(),
    userId: existing.userId,
    createdAt: deps.clock.now(),
  };
  store.set(rotated.id, rotated);
  return rotated;
}
