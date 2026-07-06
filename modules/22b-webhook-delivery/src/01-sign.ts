import { createHmac } from "node:crypto";

/**
 * WORKED EXAMPLE (🟢) — the reference you copy the pattern from.
 * Stripe-style scheme: sign `${timestamp}.${payload}` with HMAC-SHA256 and emit a
 * `t=<ts>,v1=<hmac>` header. Binding the timestamp INTO the signed content is what makes replay
 * detectable — an attacker can't reuse an old body under a fresh `t` without the secret.
 */
export function signWebhook(payload: string, secret: string, timestamp: number): string {
  const signedContent = `${timestamp}.${payload}`;
  const hmac = createHmac("sha256", secret).update(signedContent).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

/**
 * YOUR TURN (🟢 analog) — verify a signed webhook. Mirror `signWebhook`, then guard replay.
 * Steps:
 *   1. Parse the `t=..,v1=..` header into `t` (a number) and `v1` (hex). Return `false` if malformed.
 *   2. Recompute the HMAC over `${t}.${payload}` with the same secret.
 *   3. Compare in CONSTANT TIME — `crypto.timingSafeEqual(Buffer, Buffer)`, never `===`. It throws
 *      on a length mismatch, so bail to `false` first if the two buffers differ in length.
 *   4. Reject stale timestamps: `Math.abs(now - t) <= toleranceSec` is the replay guard.
 *   5. Return `signatureOk && fresh`.
 */
export function verifyWebhook(
  _payload: string,
  _header: string,
  _secret: string,
  _now: number,
  _toleranceSec = 300,
): boolean {
  throw new Error("TODO: recompute HMAC, timing-safe compare, reject stale timestamps");
}
