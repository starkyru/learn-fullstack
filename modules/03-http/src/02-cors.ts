/**
 * YOUR TURN — return the CORS response headers for a request from `origin`.
 * If `origin` is in `allowlist`: set `Access-Control-Allow-Origin` to that exact origin,
 * `Access-Control-Allow-Credentials: "true"`, and `Vary: "Origin"`.
 * If it is NOT allowed: return an object WITHOUT `Access-Control-Allow-Origin`.
 * (Never reflect an arbitrary origin, and never use "*" with credentials.)
 */
export function corsHeaders(
  _origin: string,
  _allowlist: readonly string[],
): Record<string, string> {
  throw new Error("TODO: build CORS headers based on the allowlist");
}
