/**
 * Task 2 — JWT access + refresh with reuse detection (SOLUTION).
 *
 * The stateless-token pattern the chat app uses:
 *   - A **short-lived access token** (a signed JWT) proves identity for a few minutes. It carries
 *     `sub`/`iat`/`exp`; verification checks the signature AND that `exp` is still in the future,
 *     measured against an INJECTED clock (so "expired" is deterministic in a test).
 *   - A **long-lived refresh token** exchanges for a new access token. Every refresh **rotates**:
 *     the presented refresh is marked used and a brand-new one is issued in the same *family*.
 *   - **Reuse detection** — if an already-rotated (stolen, replayed) refresh is presented, that is a
 *     theft signal: the whole family is revoked so neither the attacker's nor the victim's tokens
 *     work again. This is the OWASP-recommended refresh-token-rotation defense.
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
  secret: Uint8Array,
  claims: AccessClaims,
  clock: Clock,
): Promise<string> {
  const iat = Math.floor(clock.now() / 1000);
  return new SignJWT({
    sub: claims.sub,
    roles: claims.roles,
    iat,
    exp: iat + ACCESS_TTL_S,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}

/**
 * Verify an access token against the injected clock. Resolves to the claims, or REJECTS if the
 * signature is bad or the token has expired (`exp <= now`).
 */
export async function verifyAccessToken(
  secret: Uint8Array,
  token: string,
  clock: Clock,
): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, secret, {
    currentDate: new Date(clock.now()),
  });
  return { sub: String(payload.sub), roles: (payload.roles as string[]) ?? [] };
}

interface RefreshRecord {
  jti: string;
  familyId: string;
  used: boolean;
}

/**
 * Issues, rotates, and reuse-detects refresh tokens. Refresh tokens are signed JWTs carrying a
 * unique `jti` and a `fam` (family) id; the service keeps the server-side state rotation needs:
 * which `jti`s were issued, which were already consumed, and which families are revoked.
 */
export class RefreshTokenService {
  private readonly issued = new Map<string, RefreshRecord>();
  private readonly revokedFamilies = new Set<string>();

  constructor(
    private readonly secret: Uint8Array,
    private readonly ids: IdSource,
    private readonly clock: Clock,
  ) {}

  /** Issue a refresh token, optionally continuing an existing family (used during rotation). */
  async issue(userId: string, familyId: string = this.ids.next()): Promise<string> {
    const jti = this.ids.next();
    this.issued.set(jti, { jti, familyId, used: false });
    const iat = Math.floor(this.clock.now() / 1000);
    return new SignJWT({ sub: userId, fam: familyId, jti, iat, exp: iat + REFRESH_TTL_S })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .sign(this.secret);
  }

  /**
   * Rotate a refresh token: verify it, mark it used, and issue a fresh one in the same family.
   * If the presented token was ALREADY used (a replay), revoke the whole family and throw. Also
   * throws for a bad signature, an unknown `jti`, or a token from an already-revoked family.
   */
  async rotate(token: string): Promise<{ token: string; familyId: string }> {
    const { payload } = await jwtVerify(token, this.secret, {
      currentDate: new Date(this.clock.now()),
    });
    const jti = String(payload.jti);
    const familyId = String(payload.fam);
    const userId = String(payload.sub);

    if (this.revokedFamilies.has(familyId)) {
      throw new Error("refresh token family is revoked");
    }
    const record = this.issued.get(jti);
    if (!record) {
      throw new Error("unknown refresh token");
    }
    if (record.used) {
      // Replay of a rotated token → theft. Burn the whole family.
      this.revokedFamilies.add(familyId);
      throw new Error("refresh token reuse detected");
    }

    record.used = true;
    const next = await this.issue(userId, familyId);
    return { token: next, familyId };
  }

  isFamilyRevoked(familyId: string): boolean {
    return this.revokedFamilies.has(familyId);
  }
}
