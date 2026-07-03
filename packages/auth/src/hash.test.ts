import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./hash.js";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("Tr0ub4dour", hash)).toBe(false);
  });

  it("produces a distinct salt per call (no identical hashes)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toEqual(b);
  });

  it("returns false for a malformed stored value", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});
