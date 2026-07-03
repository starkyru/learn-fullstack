/**
 * JWT primitives for the Chat API (Pulse).
 *
 * The chat capstone authenticates with stateless **JWT / Passport-style** access tokens rather than
 * server sessions (contrast the Kanban capstone, which uses Auth.js sessions). A short-lived HS256
 * access token proves identity; the `JwtAuthGuard` verifies it against an INJECTED secret + clock so
 * "who are you" and "is this expired" are deterministic in a test.
 *
 * `issueAccessToken` is the signing half — a login route (M2, TODO) would call it after checking a
 * bcrypt password hash. It is exported so tests can mint a real, verifiable token as guard input.
 */
import { SignJWT } from "jose";

/** Injected wall clock in ms since epoch — never `Date.now()` inside verified/tested code. */
export interface Clock {
  now(): number;
}

/** A real clock for the running app (main.ts). Tests override the DI provider with a fixed one. */
export const systemClock: Clock = { now: () => Date.now() };

/** Claims carried by an access token. */
export interface AccessClaims {
  sub: string;
  roles: string[];
}

/** DI tokens (interfaces vanish at runtime, so providers key off these string tokens). */
export const JWT_SECRET = "JWT_SECRET";
export const CLOCK = "CLOCK";

export const ACCESS_TTL_S = 15 * 60; // 15 minutes

/** Sign a short-lived HS256 access token. `iat`/`exp` come from the injected clock. */
export async function issueAccessToken(
  secret: Uint8Array,
  claims: AccessClaims,
  clock: Clock,
): Promise<string> {
  const iat = Math.floor(clock.now() / 1000);
  return new SignJWT({ roles: claims.roles })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ACCESS_TTL_S)
    .sign(secret);
}
