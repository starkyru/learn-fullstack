import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe-style signature scheme: sign `${timestamp}.${payload}` with HMAC-SHA256 and emit a
 * `t=<ts>,v1=<hmac>` header. Binding the timestamp INTO the signed content is what makes replay
 * detectable — an attacker can't reuse an old body under a fresh `t` without the secret.
 */
export function signWebhook(payload: string, secret: string, timestamp: number): string {
  const signedContent = `${timestamp}.${payload}`;
  const hmac = createHmac("sha256", secret).update(signedContent).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

/** Parse a `t=..,v1=..` header into its parts (null if malformed). */
function parseHeader(header: string): { t: number; v1: string } | null {
  let t: number | undefined;
  let v1: string | undefined;
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t" && value !== undefined) t = Number(value);
    if (key === "v1" && value !== undefined) v1 = value;
  }
  if (t === undefined || Number.isNaN(t) || v1 === undefined) return null;
  return { t, v1 };
}

/**
 * Verify a signed webhook. Recompute the HMAC, compare in constant time (`timingSafeEqual`, never
 * `===`, to avoid leaking bytes via timing), and reject payloads whose timestamp is outside the
 * tolerance window — that stale-timestamp check is the replay guard.
 */
export function verifyWebhook(
  payload: string,
  header: string,
  secret: string,
  now: number,
  toleranceSec = 300,
): boolean {
  const parsed = parseHeader(header);
  if (parsed === null) return false;

  const expected = createHmac("sha256", secret)
    .update(`${parsed.t}.${payload}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(parsed.v1, "utf8");
  if (a.length !== b.length) return false; // timingSafeEqual throws on length mismatch
  const signatureOk = timingSafeEqual(a, b);

  const fresh = Math.abs(now - parsed.t) <= toleranceSec;
  return signatureOk && fresh;
}
