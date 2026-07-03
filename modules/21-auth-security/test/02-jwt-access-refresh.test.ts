import { describe, expect, it } from "vitest";
import {
  ACCESS_TTL_S,
  issueAccessToken,
  RefreshTokenService,
  verifyAccessToken,
  type Clock,
  type IdSource,
} from "../solution/02-jwt-access-refresh.js";

const SECRET = new TextEncoder().encode("test-signing-secret-000000000000");

/** A clock we can move forward between calls. */
function mutableClock(startMs: number): Clock & { set(ms: number): void } {
  let t = startMs;
  return { now: () => t, set: (ms) => (t = ms) };
}

function seqIds(prefix = "id"): IdSource {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

describe("Task 2 — JWT access + refresh", () => {
  describe("access token", () => {
    it("verifies and returns the subject + roles while unexpired", async () => {
      const clock = mutableClock(1_000_000);
      const token = await issueAccessToken(SECRET, { sub: "u1", roles: ["user"] }, clock);
      const claims = await verifyAccessToken(SECRET, token, clock);
      expect(claims).toEqual({ sub: "u1", roles: ["user"] });
    });

    it("REJECTS once the injected clock passes exp", async () => {
      const clock = mutableClock(1_000_000);
      const token = await issueAccessToken(SECRET, { sub: "u1", roles: [] }, clock);
      // Jump just past the 5-minute lifetime.
      clock.set(1_000_000 + (ACCESS_TTL_S + 1) * 1000);
      await expect(verifyAccessToken(SECRET, token, clock)).rejects.toThrow();
    });

    it("REJECTS a token signed with a different secret", async () => {
      const clock = mutableClock(1_000_000);
      const token = await issueAccessToken(SECRET, { sub: "u1", roles: [] }, clock);
      const wrong = new TextEncoder().encode("another-secret-1111111111111111");
      await expect(verifyAccessToken(wrong, token, clock)).rejects.toThrow();
    });
  });

  describe("refresh rotation + reuse detection", () => {
    it("rotation issues a NEW token and consumes the old one", async () => {
      const clock = mutableClock(2_000_000);
      // ids: t-1 (family), t-2 (first jti), then t-3 for the rotated jti.
      const svc = new RefreshTokenService(SECRET, seqIds("t"), clock);
      const first = await svc.issue("u1");
      const rotated = await svc.rotate(first);
      expect(rotated.token).not.toBe(first);
      expect(svc.isFamilyRevoked(rotated.familyId)).toBe(false);

      // ...and the OLD token is consumed: presenting it again is rejected as reuse,
      // which only holds if rotate() actually marked `first` as used.
      await expect(svc.rotate(first)).rejects.toThrow(/reuse/i);
    });

    it("replaying an already-rotated refresh triggers reuse detection + revokes the family", async () => {
      const clock = mutableClock(2_000_000);
      const svc = new RefreshTokenService(SECRET, seqIds("t"), clock);
      const first = await svc.issue("u1");
      const rotated = await svc.rotate(first); // `first` is now used

      await expect(svc.rotate(first)).rejects.toThrow(/reuse/i);
      expect(svc.isFamilyRevoked(rotated.familyId)).toBe(true);

      // The family is burned: even the legitimately-current token no longer rotates.
      await expect(svc.rotate(rotated.token)).rejects.toThrow(/revoked/i);
    });

    it("rejects a refresh token this service never issued", async () => {
      const clock = mutableClock(2_000_000);
      const svc = new RefreshTokenService(SECRET, seqIds("t"), clock);
      const other = new RefreshTokenService(SECRET, seqIds("x"), clock);
      const foreign = await other.issue("u1"); // valid signature, unknown jti to `svc`
      await expect(svc.rotate(foreign)).rejects.toThrow(/unknown/i);
    });
  });
});
