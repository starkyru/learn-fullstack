/**
 * Task 3 — OAuth 2.0 / OIDC authorization-code + PKCE (SOLUTION).
 *
 * Auth.js is the *library* the Kanban (Next) app wires up (see `docs/authjs-config.md`), but the
 * security lives in the flow itself — so we build the flow testably here:
 *   - **PKCE** (`createPkcePair`) — a random `code_verifier` and its `S256` `code_challenge`
 *     (`base64url(sha256(verifier))`), so an intercepted authorization code is useless without the
 *     verifier. RFC 7636.
 *   - **state** (`verifyState`) — a random value echoed back on the callback and compared in
 *     constant time; a mismatch means the callback was CSRF-forged.
 *   - **code exchange** (`exchangeCode`) — POST the code + verifier to the provider's token
 *     endpoint (INJECTED here as a `fetch`-shaped function — the true external boundary).
 *   - **id-token verification** (`verifyIdToken`) — verify the OIDC id_token's signature via a
 *     JWKS/key, and check `iss` / `aud` / `exp` (injected clock) / `nonce`. Any tampering, wrong
 *     audience, or replayed nonce is rejected.
 *
 * All randomness is INJECTED (`Entropy`) so the flow is reproducible; hashing uses Node's SHA-256
 * (a pure function, not a determinism hazard).
 */
import { createHash } from "node:crypto";
import { jwtVerify, type KeyLike } from "jose";
import { z } from "zod";

/** Injected CSPRNG boundary — never `Math.random()`. */
export interface Entropy {
  random(byteLength: number): Uint8Array;
}

export function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export interface PkcePair {
  verifier: string;
  challenge: string;
  method: "S256";
}

/** Create a PKCE verifier (43-char base64url of 32 bytes) and its SHA-256 `S256` challenge. */
export function createPkcePair(entropy: Entropy): PkcePair {
  const verifier = base64url(entropy.random(32));
  const challenge = base64url(createHash("sha256").update(verifier, "ascii").digest());
  return { verifier, challenge, method: "S256" };
}

export interface AuthClientConfig {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

/** Build the provider authorization URL carrying PKCE challenge + state + nonce. */
export function buildAuthUrl(
  config: AuthClientConfig,
  params: { state: string; nonce: string; challenge: string },
): string {
  const url = new URL(config.authorizationEndpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

/** Constant-time string compare — `false` on any length or byte mismatch. */
export function verifyState(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export interface TokenResponse {
  id_token: string;
  access_token: string;
}

/** A provider token endpoint, shaped like the real `fetch(url, init)` boundary. */
export type TokenEndpoint = (body: Record<string, string>) => Promise<TokenResponse>;

/**
 * Exchange an authorization code for tokens. Validates state FIRST (a bad callback never reaches
 * the network), then posts the code + PKCE verifier to the injected token endpoint.
 */
export async function exchangeCode(
  tokenEndpoint: TokenEndpoint,
  args: {
    code: string;
    verifier: string;
    expectedState: string;
    receivedState: string;
    redirectUri: string;
    clientId: string;
  },
): Promise<TokenResponse> {
  if (!verifyState(args.expectedState, args.receivedState)) {
    throw new Error("state mismatch — possible CSRF on the OAuth callback");
  }
  return tokenEndpoint({
    grant_type: "authorization_code",
    code: args.code,
    code_verifier: args.verifier,
    redirect_uri: args.redirectUri,
    client_id: args.clientId,
  });
}

/** Injected clock (ms) so `exp` checks are deterministic. */
export interface Clock {
  now(): number;
}

const claimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export interface IdTokenClaims {
  sub: string;
  email?: string;
  name?: string;
}

/**
 * Verify an OIDC id_token: signature (via the JWKS/key), `iss`, `aud`, `exp` (injected clock), and
 * the `nonce` binding it to THIS login. Rejects a tampered token, wrong issuer/audience, an expired
 * token, or a mismatched/absent nonce. Returns the validated user claims.
 */
export async function verifyIdToken(
  idToken: string,
  opts: {
    key: KeyLike | Uint8Array;
    issuer: string;
    audience: string;
    nonce: string;
    clock: Clock;
  },
): Promise<IdTokenClaims> {
  const { payload } = await jwtVerify(idToken, opts.key, {
    issuer: opts.issuer,
    audience: opts.audience,
    currentDate: new Date(opts.clock.now()),
  });
  if (payload.nonce !== opts.nonce) {
    throw new Error("id_token nonce mismatch — possible replay");
  }
  return claimsSchema.parse(payload);
}
