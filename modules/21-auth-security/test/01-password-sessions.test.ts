import { describe, expect, it } from "vitest";
import {
  hashPassword,
  login,
  logout,
  rotateSession,
  verifyPassword,
  type Clock,
  type IdSource,
  type Session,
  type SessionStore,
  type StoredUser,
} from "../solution/01-password-sessions.js";

/** A deterministic id source: sess-1, sess-2, … so assertions can name the exact id. */
function seqIds(): IdSource {
  let n = 0;
  return { next: () => `sess-${++n}` };
}

/** A frozen clock, ticking only when we tell it to. */
function fixedClock(t: number): Clock {
  return { now: () => t };
}

describe("Task 1 — password + sessions", () => {
  describe("hashPassword / verifyPassword (worked example)", () => {
    it("stores a salted bcrypt digest, never the raw password", () => {
      const hash = hashPassword("hunter2");
      expect(hash).not.toBe("hunter2");
      expect(hash).not.toContain("hunter2");
      // bcrypt digests are self-describing: $2<a|b>$<cost>$<22-char-salt><31-char-hash>.
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    });

    it("verify accepts ONLY the exact password", () => {
      const hash = hashPassword("correct horse");
      expect(verifyPassword("correct horse", hash)).toBe(true);
      expect(verifyPassword("correct hors", hash)).toBe(false);
      expect(verifyPassword("Correct Horse", hash)).toBe(false);
      expect(verifyPassword("", hash)).toBe(false);
    });

    it("the same password hashed twice yields different digests (random salt)", () => {
      expect(hashPassword("same")).not.toBe(hashPassword("same"));
    });
  });

  describe("login (worked example)", () => {
    const users = new Map<string, StoredUser>([
      ["ada", { id: "u1", username: "ada", passwordHash: hashPassword("s3cret") }],
    ]);

    it("a correct password mints a server session from the injected id + clock", () => {
      const store: SessionStore = new Map();
      const session = login(users, store, "ada", "s3cret", {
        ids: seqIds(),
        clock: fixedClock(1000),
      });
      expect(session).toEqual<Session>({ id: "sess-1", userId: "u1", createdAt: 1000 });
      expect(store.get("sess-1")).toEqual({
        id: "sess-1",
        userId: "u1",
        createdAt: 1000,
      });
    });

    it("a wrong password returns null and stores no session", () => {
      const store: SessionStore = new Map();
      const session = login(users, store, "ada", "nope", {
        ids: seqIds(),
        clock: fixedClock(1000),
      });
      expect(session).toBeNull();
      expect(store.size).toBe(0);
    });

    it("an unknown user returns null (same shape — no enumeration)", () => {
      const store: SessionStore = new Map();
      expect(
        login(users, store, "ghost", "s3cret", {
          ids: seqIds(),
          clock: fixedClock(1000),
        }),
      ).toBeNull();
    });
  });

  describe("logout / rotateSession (your analog)", () => {
    it("logout revokes exactly the named session", () => {
      const store: SessionStore = new Map([
        ["sess-1", { id: "sess-1", userId: "u1", createdAt: 10 }],
      ]);
      expect(logout(store, "sess-1")).toBe(true);
      expect(store.has("sess-1")).toBe(false);
      expect(logout(store, "sess-1")).toBe(false);
    });

    it("rotateSession invalidates the old id and issues a fresh one for the same user", () => {
      const store: SessionStore = new Map([
        ["sess-1", { id: "sess-1", userId: "u1", createdAt: 10 }],
      ]);
      const ids: IdSource = { next: () => "sess-2" };
      const rotated = rotateSession(store, "sess-1", { ids, clock: fixedClock(50) });
      expect(rotated).toEqual<Session>({ id: "sess-2", userId: "u1", createdAt: 50 });
      expect(store.has("sess-1")).toBe(false);
      expect(store.get("sess-2")).toEqual({ id: "sess-2", userId: "u1", createdAt: 50 });
    });

    it("rotateSession on an unknown id returns null and changes nothing", () => {
      const store: SessionStore = new Map();
      expect(
        rotateSession(store, "ghost", { ids: seqIds(), clock: fixedClock(1) }),
      ).toBeNull();
      expect(store.size).toBe(0);
    });
  });
});
