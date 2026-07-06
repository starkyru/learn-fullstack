import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signWebhook, verifyWebhook } from "../solution/01-sign.js";

const PAYLOAD = '{"id":"evt_1"}';
const SECRET = "whsec_test";
const TS = 1_700_000_000;

describe("signWebhook", () => {
  it("emits t=<ts>,v1=<hmac> where v1 is HMAC-SHA256 of `${ts}.${payload}`", () => {
    // Independent oracle: compute the digest directly from node:crypto (the primitive), NOT via
    // signWebhook, then assert signWebhook assembled the same envelope around it.
    const expected = createHmac("sha256", SECRET)
      .update(`${TS}.${PAYLOAD}`)
      .digest("hex");
    expect(signWebhook(PAYLOAD, SECRET, TS)).toBe(`t=${TS},v1=${expected}`);
  });

  it("changes when the timestamp changes (timestamp is bound into the signed content)", () => {
    expect(signWebhook(PAYLOAD, SECRET, TS)).not.toBe(
      signWebhook(PAYLOAD, SECRET, TS + 1),
    );
  });
});

describe("verifyWebhook", () => {
  it("accepts a fresh, untampered signature within tolerance", () => {
    const header = signWebhook(PAYLOAD, SECRET, TS);
    expect(verifyWebhook(PAYLOAD, header, SECRET, TS + 60, 300)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const header = signWebhook(PAYLOAD, SECRET, TS);
    expect(verifyWebhook('{"id":"evt_2"}', header, SECRET, TS, 300)).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const header = signWebhook(PAYLOAD, SECRET, TS);
    expect(verifyWebhook(PAYLOAD, header, "whsec_wrong", TS, 300)).toBe(false);
  });

  it("rejects a stale timestamp just outside tolerance (replay guard)", () => {
    const header = signWebhook(PAYLOAD, SECRET, TS);
    expect(verifyWebhook(PAYLOAD, header, SECRET, TS + 301, 300)).toBe(false);
    // ...but accepts one exactly at the boundary.
    expect(verifyWebhook(PAYLOAD, header, SECRET, TS + 300, 300)).toBe(true);
  });

  it("rejects a well-formed header carrying the wrong digest", () => {
    expect(verifyWebhook(PAYLOAD, `t=${TS},v1=${"0".repeat(64)}`, SECRET, TS, 300)).toBe(
      false,
    );
  });

  it("rejects a malformed header", () => {
    expect(verifyWebhook(PAYLOAD, "garbage", SECRET, TS, 300)).toBe(false);
    expect(verifyWebhook(PAYLOAD, `t=${TS}`, SECRET, TS, 300)).toBe(false);
  });
});
