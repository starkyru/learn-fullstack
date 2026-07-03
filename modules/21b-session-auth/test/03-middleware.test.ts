import { describe, expect, it } from "vitest";
import {
  createMemorySessionStore,
  createSessionManager,
  type SessionManager,
  type SessionTtl,
} from "../solution/01-session.js";
import {
  HttpError,
  requireSession,
  type RequestLike,
} from "../solution/03-middleware.js";

const ALLOWED = ["https://app.example.com"];

function harness(ttl: SessionTtl, startAt = 1000) {
  const clock = { t: startAt };
  let n = 0;
  const manager: SessionManager = createSessionManager(createMemorySessionStore(), {
    now: () => clock.t,
    generateToken: () => `tok-${n++}`,
    ttl,
  });
  return { clock, manager };
}

/** Run the guard and capture a thrown HttpError (or null if it returned). */
function thrown(fn: () => unknown): HttpError | null {
  try {
    fn();
    return null;
  } catch (e) {
    return e as HttpError;
  }
}

describe("requireSession", () => {
  it("throws 401 when the session cookie is missing", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const guard = requireSession({ manager });
    const req: RequestLike = { method: "GET", headers: {} };

    const err = thrown(() => guard(req));
    expect(err).toBeInstanceOf(HttpError);
    expect(err?.status).toBe(401);
  });

  it("throws 401 when the session token is invalid", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const guard = requireSession({ manager });
    const req: RequestLike = { method: "GET", headers: { cookie: "session=forged" } };

    const err = thrown(() => guard(req));
    expect(err?.status).toBe(401);
  });

  it("passes a valid session on a safe method and attaches it", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");
    const guard = requireSession({ manager });
    const req: RequestLike = {
      method: "GET",
      headers: { cookie: `session=${issued.token}` },
    };

    const ctx = guard(req);
    expect(ctx.session.record.userId).toBe("user-1");
    expect(ctx.session.rotated).toBe(false);
    expect(ctx.setCookies).toEqual([]);
  });

  it("throws 403 on an unsafe method when the double-submit CSRF token mismatches", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");
    const guard = requireSession({ manager, csrf: { allowedOrigins: ALLOWED } });
    const req: RequestLike = {
      method: "POST",
      headers: {
        cookie: `session=${issued.token}; csrf=csrf-abc`,
        "x-csrf-token": "csrf-WRONG",
        origin: "https://app.example.com",
      },
    };

    const err = thrown(() => guard(req));
    expect(err?.status).toBe(403);
  });

  it("fails closed with 403 on an unsafe method when CSRF is not configured", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");
    const guard = requireSession({ manager }); // no csrf option → must reject unsafe methods
    const req: RequestLike = {
      method: "POST",
      headers: { cookie: `session=${issued.token}` },
    };

    const err = thrown(() => guard(req));
    expect(err).toBeInstanceOf(HttpError);
    expect(err?.status).toBe(403);
  });

  it("passes an unsafe method when CSRF token matches and origin is allowlisted", () => {
    const { manager } = harness({ idleMs: 1000, absoluteMs: 10_000, renewMs: 0 });
    const issued = manager.createSession("user-1");
    const guard = requireSession({ manager, csrf: { allowedOrigins: ALLOWED } });
    const req: RequestLike = {
      method: "POST",
      headers: {
        cookie: `session=${issued.token}; csrf=csrf-abc`,
        "x-csrf-token": "csrf-abc",
        origin: "https://app.example.com",
      },
    };

    const ctx = guard(req);
    expect(ctx.session.record.userId).toBe("user-1");
  });

  it("re-issues a hardened Set-Cookie when the session rotates", () => {
    const { manager, clock } = harness({
      idleMs: 1000,
      absoluteMs: 10_000,
      renewMs: 500,
    });
    const issued = manager.createSession("user-1"); // expiresAt=2000
    const guard = requireSession({ manager, now: () => clock.t });

    clock.t = 1600; // within renew window → rotation
    const ctx = guard({ method: "GET", headers: { cookie: `session=${issued.token}` } });

    expect(ctx.session.rotated).toBe(true);
    expect(ctx.setCookies).toHaveLength(1);
    expect(ctx.setCookies[0]).toContain(`session=${ctx.session.token}`);
    expect(ctx.setCookies[0]).toContain("HttpOnly");
    expect(ctx.setCookies[0]).toContain("SameSite=Lax");
  });
});
