import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  createMemorySessionStore,
  createSessionManager,
  parseCookies,
  serializeSessionCookie,
  signValue,
  verifySignedValue,
  type SessionManagerOptions,
} from "../solution/01-session.js";

// Independently derived expectations (standard primitives, NOT the module's helpers).
const sha256url = (s: string): string =>
  createHash("sha256").update(s).digest("base64url");
const hmacUrl = (secret: string, s: string): string =>
  createHmac("sha256", secret).update(s).digest("base64url");

/** A deterministic clock + token source so nothing depends on Date.now / randomBytes. */
function harness(ttl: SessionManagerOptions["ttl"], startAt = 1000) {
  const clock = { t: startAt };
  let n = 0;
  const store = createMemorySessionStore();
  const manager = createSessionManager(store, {
    now: () => clock.t,
    generateToken: () => `tok-${n++}`,
    ttl,
  });
  return { clock, store, manager };
}

describe("createSessionManager", () => {
  it("creates a session that validates back to the same user (not rotated)", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");
    expect(issued.token).toBe("tok-0");

    const validated = manager.validateSession("tok-0");
    expect(validated).not.toBeNull();
    expect(validated?.rotated).toBe(false);
    expect(validated?.record.userId).toBe("user-1");
    expect(validated?.token).toBe("tok-0");
  });

  it("stores only the sha256 hash of the token, never the raw token", () => {
    const { manager, store } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");

    // Nothing is stored under the raw token.
    expect(store.get(issued.token)).toBeUndefined();

    // The record lives under the independently-computed hash.
    const record = store.get(sha256url(issued.token));
    expect(record).toBeDefined();
    expect(record?.hashedToken).toBe(sha256url(issued.token));
    expect(record?.hashedToken).not.toBe(issued.token);
  });

  it("returns null for a forged/tampered token", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    manager.createSession("user-1");

    expect(manager.validateSession("tok-0-tampered")).toBeNull();
    expect(manager.validateSession("totally-forged")).toBeNull();
  });

  it("returns null past the idle deadline and deletes the record", () => {
    const { manager, store, clock } = harness({
      idleMs: 1000,
      absoluteMs: 10_000,
      renewMs: 0,
    });
    const issued = manager.createSession("user-1"); // createdAt=1000, expiresAt=2000

    clock.t = 2000; // now >= expiresAt
    expect(manager.validateSession("tok-0")).toBeNull();
    expect(store.get(sha256url(issued.token))).toBeUndefined();
  });

  it("returns null past the absolute cap even while active", () => {
    // idle would slide, but the absolute cap is 3000ms from creation.
    const { manager, clock } = harness({ idleMs: 10_000, absoluteMs: 3000, renewMs: 0 });
    manager.createSession("user-1"); // createdAt=1000, cap at 4000

    clock.t = 4000; // now >= createdAt + absoluteMs
    expect(manager.validateSession("tok-0")).toBeNull();
  });

  it("enforces the absolute cap even when the idle deadline sits PAST the cap", () => {
    // The idle check alone cannot reject this: we simulate a session whose idle deadline has been
    // renewed to sit far past the absolute cap (now < expiresAt), so ONLY the absolute-cap check
    // can return null. This discriminates the cap block from the idle check that otherwise masks it.
    const { manager, store, clock } = harness({
      idleMs: 10_000,
      absoluteMs: 3000,
      renewMs: 1000,
    });
    const issued = manager.createSession("user-1"); // createdAt=1000, cap at 4000
    const hashed = sha256url(issued.token);
    const rec = store.get(hashed);
    expect(rec).toBeDefined();
    // Idle deadline slid to 50_000 — a freshly-renewed window that outlives the cap.
    store.set(hashed, { ...rec!, expiresAt: 50_000 });

    clock.t = 4000; // >= createdAt + absoluteMs (cap), but well inside the (slid) idle window
    expect(manager.validateSession(issued.token)).toBeNull();
  });

  it("preserves createdAt across rotation so the cap can't be extended by refreshing", () => {
    // idleMs > absoluteMs so createSession's expiry is clamped to the cap (4000); renewMs opens a
    // rotation window before the cap. If rotation reset createdAt to `current`, both the cap and the
    // idle deadline would move forward and the session would survive past the ORIGINAL cap.
    const { manager, clock } = harness({
      idleMs: 10_000,
      absoluteMs: 3000,
      renewMs: 2000,
    });
    const issued = manager.createSession("user-1"); // createdAt=1000, cap at 4000

    clock.t = 2500; // within renew window (>= 4000-2000) → rotate to a fresh token
    const rotated = manager.validateSession(issued.token);
    expect(rotated?.rotated).toBe(true);
    expect(rotated?.token).toBe("tok-1");
    // createdAt must be carried over unchanged — NOT reset to the rotation time (2500).
    expect(rotated?.record.createdAt).toBe(1000);

    clock.t = 4000; // past the ORIGINAL createdAt + absoluteMs
    expect(manager.validateSession(rotated!.token)).toBeNull();
  });

  it("rotates near the idle deadline: new token validates, old token is dead", () => {
    const { manager, clock } = harness({
      idleMs: 1000,
      absoluteMs: 10_000,
      renewMs: 500,
    });
    manager.createSession("user-1"); // createdAt=1000, expiresAt=2000

    clock.t = 1600; // within renewMs (>= 2000-500) → rotate
    const rotated = manager.validateSession("tok-0");
    expect(rotated?.rotated).toBe(true);
    expect(rotated?.token).toBe("tok-1"); // fresh id
    expect(rotated?.record.userId).toBe("user-1");

    // Old token no longer validates; the new one does.
    expect(manager.validateSession("tok-0")).toBeNull();
    expect(manager.validateSession("tok-1")?.rotated).toBe(false);
  });

  it("invalidateSession drops the session immediately", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    manager.createSession("user-1");

    manager.invalidateSession("tok-0");
    expect(manager.validateSession("tok-0")).toBeNull();
  });
});

describe("constantTimeEqual", () => {
  it("is true for equal inputs and false for any difference, including different lengths", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("", "")).toBe(true);
    // Same length, one byte differs.
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    // Different lengths must return false (not throw) — the length guard runs before timingSafeEqual.
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("abcd", "abc")).toBe(false);
  });
});

describe("serializeSessionCookie", () => {
  it("emits HttpOnly, Secure, SameSite=Lax, Path=/ and a Max-Age from expiry", () => {
    const cookie = serializeSessionCookie("session", "tok-0", {
      expiresAt: 3000,
      now: () => 1000, // 2000ms → 2s
    });
    expect(cookie).toContain("session=tok-0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=2");
    expect(cookie).toContain("Expires=");
  });

  it("honors SameSite and Secure overrides", () => {
    const cookie = serializeSessionCookie("session", "tok-0", {
      sameSite: "Strict",
      secure: false,
    });
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("Secure");
  });

  it("clamps Max-Age to 0 for an already-expired cookie (never negative)", () => {
    const cookie = serializeSessionCookie("session", "tok-0", {
      expiresAt: 1000,
      now: () => 5000, // expired 4s ago → raw (1000-5000)/1000 = -4
    });
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).not.toContain("Max-Age=-");
  });
});

describe("parseCookies", () => {
  it("parses a Cookie header into a map and returns {} for none", () => {
    expect(parseCookies("session=tok-0; csrf=abc")).toEqual({
      session: "tok-0",
      csrf: "abc",
    });
    expect(parseCookies(undefined)).toEqual({});
  });

  it("lets a later duplicate key win over an earlier one", () => {
    expect(parseCookies("a=1; a=2")).toEqual({ a: "2" });
  });

  it("ignores malformed segments: no '=', empty, and empty-key parts", () => {
    expect(parseCookies("a=1; ; b=2; nokeyvalue; =noname")).toEqual({ a: "1", b: "2" });
  });
});

describe("signed cookies", () => {
  it("signValue appends the HMAC and verifySignedValue round-trips it", () => {
    const secret = "s3cr3t";
    const signed = signValue("tok-0", secret);
    expect(signed).toBe(`tok-0.${hmacUrl(secret, "tok-0")}`);
    expect(verifySignedValue(signed, secret)).toBe("tok-0");
  });

  it("verifySignedValue rejects a tampered signature or wrong secret", () => {
    const signed = signValue("tok-0", "s3cr3t");
    expect(verifySignedValue(`tok-0.deadbeef`, "s3cr3t")).toBeNull();
    expect(verifySignedValue(signed, "wrong-secret")).toBeNull();
  });
});
