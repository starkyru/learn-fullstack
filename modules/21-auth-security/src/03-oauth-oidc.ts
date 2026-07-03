/**
 * Task 3 — OAuth 2.0 / OIDC authorization-code + PKCE (TODO).
 *
 * Auth.js is the *library* the Kanban (Next) app wires up (see `docs/authjs-config.md`), but the
 * security lives in the flow — build it testably here. Fill in each body (all currently THROW):
 *   - `createPkcePair` — `verifier = base64url(entropy.random(32))`, `challenge =
 *     base64url(sha256(verifier))` (hash the ASCII of the verifier string), `method: "S256"`.
 *   - `buildAuthUrl` — an authorization URL with `response_type=code`, `client_id`, `redirect_uri`,
 *     `scope`, `state`, `nonce`, `code_challenge`, `code_challenge_method=S256`.
 *   - `verifyState` — CONSTANT-TIME compare (no early `===`); `false` on length or byte mismatch.
 *   - `exchangeCode` — verify state first, then post code + verifier to the injected endpoint.
 *   - `verifyIdToken` — `jwtVerify` with `{ issuer, audience, currentDate }`, then check `nonce`,
 *     then parse the claims. Reject tampered / wrong-aud / expired / bad-nonce tokens.
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
export function createPkcePair(_entropy: Entropy): PkcePair {
  void createHash;
  throw new Error(
    "TODO: base64url(random(32)) verifier + base64url(sha256(verifier)) challenge",
  );
}

export interface AuthClientConfig {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

/** Build the provider authorization URL carrying PKCE challenge + state + nonce. */
export function buildAuthUrl(
  _config: AuthClientConfig,
  _params: { state: string; nonce: string; challenge: string },
): string {
  throw new Error("TODO: assemble the authorization URL query string");
}

/** Constant-time string compare — `false` on any length or byte mismatch. */
export function verifyState(_expected: string, _received: string): boolean {
  throw new Error("TODO: constant-time compare of the two state values");
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
  _tokenEndpoint: TokenEndpoint,
  _args: {
    code: string;
    verifier: string;
    expectedState: string;
    receivedState: string;
    redirectUri: string;
    clientId: string;
  },
): Promise<TokenResponse> {
  throw new Error(
    "TODO: verify state, then post grant_type=authorization_code to the endpoint",
  );
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
  _idToken: string,
  _opts: {
    key: KeyLike | Uint8Array;
    issuer: string;
    audience: string;
    nonce: string;
    clock: Clock;
  },
): Promise<IdTokenClaims> {
  void jwtVerify;
  void claimsSchema;
  throw new Error("TODO: jwtVerify(iss/aud/exp), assert nonce, then parse the claims");
}
