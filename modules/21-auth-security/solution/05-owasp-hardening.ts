/**
 * Task 5 — OWASP hardening: stored XSS + CSRF (SOLUTION).
 *
 * Two exploit-then-fix pairs, built from primitives:
 *   - **Stored XSS.** `renderCommentUnsafe` interpolates user content straight into HTML — a saved
 *     `<script>` runs for every viewer. `escapeHtml` neutralizes the five HTML-significant chars
 *     (plus `/`), and `renderCommentSafe` uses it so the payload renders as inert text.
 *   - **CSRF.** `verifyCsrf` implements the double-submit-cookie pattern PLUS an Origin check: the
 *     `X-CSRF-Token` header must equal the `csrf` cookie (compared in constant time) AND the request
 *     Origin must match the app's own origin. A forged cross-site POST satisfies neither.
 */

/** Constant-time string compare — avoids leaking token bytes via response timing. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * THE VULNERABILITY (kept intact so a test can prove the exploit). Interpolates raw user content
 * into markup — a stored `<script>` executes in every viewer's browser.
 */
export function renderCommentUnsafe(content: string): string {
  return `<div class="comment">${content}</div>`;
}

/** Escape the HTML-significant characters so content renders as inert text. `&` must go first. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}

/** THE FIX: same markup, escaped content. */
export function renderCommentSafe(content: string): string {
  return `<div class="comment">${escapeHtml(content)}</div>`;
}

export interface CsrfRequest {
  method: string;
  originHeader: string | undefined;
  cookieToken: string | undefined;
  headerToken: string | undefined;
}

/**
 * Accept a state-changing request only if BOTH defenses pass:
 *   1. Origin check — the `Origin` header equals the app's own origin.
 *   2. Double-submit — the `X-CSRF-Token` header equals the `csrf` cookie (constant-time).
 * Safe (read-only) methods are always allowed. Returns `true` to accept, `false` to reject.
 */
export function verifyCsrf(req: CsrfRequest, allowedOrigin: string): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }
  if (req.originHeader !== allowedOrigin) return false;
  if (!req.cookieToken || !req.headerToken) return false;
  return timingSafeEqualStr(req.cookieToken, req.headerToken);
}
