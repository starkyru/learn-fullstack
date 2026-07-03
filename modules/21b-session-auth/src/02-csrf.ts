/**
 * CSRF defense: the double-submit pattern plus an Origin/Referer allowlist. Both must pass.
 *
 * YOUR TURN — implement the functions below (keep the signatures/return shapes):
 *   - issueCsrfToken(generateToken?): mint a high-entropy token (default `randomBytes(32)` base64url).
 *   - isAllowedOrigin(origin, referer, allowedOrigins): prefer `origin`; else parse `referer`'s
 *     origin; a request with neither is REJECTED (never default-allow).
 *   - verifyCsrf({ cookieToken, submittedToken, origin, referer, allowedOrigins }): return `true`
 *     ONLY when the origin is allowlisted AND the two tokens are present and CONSTANT-TIME equal.
 */

export function issueCsrfToken(_generateToken?: () => string): string {
  throw new Error("TODO: mint a base64url CSRF token (inject generateToken for tests)");
}

export function isAllowedOrigin(
  _origin: string | undefined,
  _referer: string | undefined,
  _allowedOrigins: string[],
): boolean {
  throw new Error("TODO: allowlist Origin, fall back to Referer's origin, else reject");
}

export interface CsrfVerifyInput {
  cookieToken: string | undefined;
  submittedToken: string | undefined;
  origin: string | undefined;
  allowedOrigins: string[];
  referer?: string | undefined;
}

export function verifyCsrf(_input: CsrfVerifyInput): boolean {
  throw new Error(
    "TODO: allowlist origin AND constant-time compare the double-submit tokens",
  );
}
