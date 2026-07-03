/**
 * Task 5 — OWASP hardening: stored XSS + CSRF (FROM SCRATCH).
 *
 * `renderCommentUnsafe` and `timingSafeEqualStr` below are provided — the first IS the vulnerability
 * (leave it, a test proves the exploit); the second is a primitive you'll reuse. Build the fixes
 * (each currently THROWS):
 *   - `escapeHtml` — replace `&` → `&amp;` FIRST, then `<`→`&lt;`, `>`→`&gt;`, `"`→`&quot;`,
 *     `'`→`&#39;`, `/`→`&#x2F;`.
 *   - `renderCommentSafe` — the same markup as the unsafe version but with `escapeHtml(content)`.
 *   - `verifyCsrf` — allow safe methods; otherwise require Origin === allowedOrigin AND a
 *     constant-time match between the `csrf` cookie and the `X-CSRF-Token` header (both present).
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
export function escapeHtml(_input: string): string {
  throw new Error("TODO: escape & < > \" ' / to HTML entities (& first)");
}

/** THE FIX: same markup, escaped content. */
export function renderCommentSafe(_content: string): string {
  throw new Error("TODO: wrap escapeHtml(content) in the comment markup");
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
export function verifyCsrf(_req: CsrfRequest, _allowedOrigin: string): boolean {
  void timingSafeEqualStr;
  throw new Error(
    "TODO: allow safe methods; else require matching origin + double-submit token",
  );
}
