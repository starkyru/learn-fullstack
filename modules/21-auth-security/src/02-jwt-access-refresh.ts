/**
 * Task 2 — JWT access + refresh with reuse detection (TODO).
 *
 * Implement the stateless-token pattern the chat app uses. Signatures and shapes are fixed; fill in
 * the bodies (each currently THROWS).
 *   - `issueAccessToken` — sign a short-lived HS256 JWT with `sub`/`roles`/`iat`/`exp`, `iat`/`exp`
 *     derived from the injected `clock` (`iat = floor(now/1000)`, `exp = iat + ACCESS_TTL_S`).
 *   - `verifyAccessToken` — `jwtVerify` against the injected clock (`{ currentDate: new Date(clock.now()) }`)
 *     so an expired token REJECTS; return `{ sub, roles }`.
 *   - `RefreshTokenService` — issue signed refresh tokens (unique `jti`, shared `fam` family id),
 *     ROTATE (mark presented used, mint a fresh one in the same family), and DETECT REUSE (a replay
 *     of an already-used token revokes the whole family).
 *
 * jose recipe: `new SignJWT({...}).setProtectedHeader({ alg: "HS256", typ: "JWT" }).sign(secret)`
 * and `const { payload } = await jwtVerify(token, secret, { currentDate });`.
 */
import { jwtVerify, SignJWT } from "jose";

/** Injected clock in ms since epoch — never `Date.now()`. */
export interface Clock {
  now(): number;
}

/** Injected opaque id source for token ids / family ids — never `Math.random()`. */
export interface IdSource {
  next(): string;
}

export const ACCESS_TTL_S = 5 * 60; // 5 minutes
export const REFRESH_TTL_S = 7 * 24 * 60 * 60; // 7 days

export interface AccessClaims {
  sub: string;
  roles: string[];
}

/** Sign a short-lived HS256 access token. `iat`/`exp` come from the injected clock. */
export async function issueAccessToken(
  _secret: Uint8Array,
  _claims: AccessClaims,
  _clock: Clock,
): Promise<string> {
  // Keep `SignJWT` imported: build `{ sub, roles, iat, exp }`, set the HS256 header, sign.
  void SignJWT;
  throw new Error("TODO: sign a short-lived access token with clock-derived iat/exp");
}

/**
 * Verify an access token against the injected clock. Resolves to the claims, or REJECTS if the
 * signature is bad or the token has expired (`exp <= now`).
 */
export async function verifyAccessToken(
  _secret: Uint8Array,
  _token: string,
  _clock: Clock,
): Promise<AccessClaims> {
  void jwtVerify;
  throw new Error("TODO: jwtVerify with { currentDate } and return { sub, roles }");
}

/**
 * Issues, rotates, and reuse-detects refresh tokens. Refresh tokens are signed JWTs carrying a
 * unique `jti` and a `fam` (family) id; keep the server-side state rotation needs: which `jti`s
 * were issued, which were already consumed, and which families are revoked.
 */
export class RefreshTokenService {
  constructor(
    private readonly secret: Uint8Array,
    private readonly ids: IdSource,
    private readonly clock: Clock,
  ) {
    void this.secret;
    void this.ids;
    void this.clock;
  }

  /** Issue a refresh token, optionally continuing an existing family (used during rotation). */
  async issue(_userId: string, _familyId?: string): Promise<string> {
    throw new Error("TODO: record a fresh jti in the family and sign a refresh JWT");
  }

  /**
   * Rotate a refresh token: verify it, mark it used, and issue a fresh one in the same family.
   * If the presented token was ALREADY used (a replay), revoke the whole family and throw. Also
   * throws for a bad signature, an unknown `jti`, or a token from an already-revoked family.
   */
  async rotate(_token: string): Promise<{ token: string; familyId: string }> {
    throw new Error(
      "TODO: verify, reject revoked/unknown, detect reuse (revoke family), else rotate",
    );
  }

  isFamilyRevoked(_familyId: string): boolean {
    throw new Error("TODO: report whether the family has been revoked");
  }
}
