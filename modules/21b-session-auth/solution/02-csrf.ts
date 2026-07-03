/**
 * CSRF defense: the **double-submit** pattern plus an **Origin/Referer** allowlist.
 *
 *   - Issue a random anti-CSRF token; the app sets it in a (readable) cookie AND the client echoes
 *     it in a request header/body field. `verifyCsrf` CONSTANT-TIME compares the two — a
 *     cross-site page can read neither cookie nor set the custom header.
 *   - Independently, the request's `Origin` (or `Referer`) must be on an allowlist. A forged
 *     cross-origin `POST` fails here even if the tokens somehow lined up.
 *
 * Both checks must pass. Randomness is INJECTED (defaulting to `crypto.randomBytes`) for determinism.
 */

import { randomBytes } from "node:crypto";
import { constantTimeEqual } from "./01-session.js";

/** Mint a high-entropy CSRF token (base64url). Inject `generateToken` in tests. */
export function issueCsrfToken(
  generateToken: () => string = () => randomBytes(32).toString("base64url"),
): string {
  return generateToken();
}

/**
 * Origin allowlist check. Prefer `Origin`; fall back to the `Referer`'s origin. A request with
 * neither (or an unparseable/absent origin) is REJECTED — we never default-allow.
 */
export function isAllowedOrigin(
  origin: string | undefined,
  referer: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (origin !== undefined && origin !== "") {
    return allowedOrigins.includes(origin);
  }
  if (referer !== undefined && referer !== "") {
    try {
      return allowedOrigins.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return false;
}

export interface CsrfVerifyInput {
  cookieToken: string | undefined;
  submittedToken: string | undefined;
  origin: string | undefined;
  allowedOrigins: string[];
  referer?: string | undefined;
}

/**
 * `true` only when BOTH the origin is allowlisted AND the double-submit tokens match (constant-time).
 * A missing token on either side, a token mismatch, or a bad/absent origin → `false`.
 */
export function verifyCsrf(input: CsrfVerifyInput): boolean {
  const { cookieToken, submittedToken, origin, referer, allowedOrigins } = input;
  if (!isAllowedOrigin(origin, referer, allowedOrigins)) return false;
  if (cookieToken === undefined || cookieToken === "") return false;
  if (submittedToken === undefined || submittedToken === "") return false;
  return constantTimeEqual(cookieToken, submittedToken);
}
