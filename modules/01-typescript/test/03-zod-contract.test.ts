import { describe, expect, it } from "vitest";
import { parseLogin } from "../solution/03-zod-contract.js";

describe("parseLogin", () => {
  it("accepts a valid login and returns the typed value", () => {
    const login = parseLogin({ email: "a@b.com", password: "longenough" });
    expect(login.email).toBe("a@b.com");
  });

  it("rejects a short password", () => {
    expect(() => parseLogin({ email: "a@b.com", password: "short" })).toThrow();
  });

  it("rejects a bad email", () => {
    expect(() => parseLogin({ email: "nope", password: "longenough" })).toThrow();
  });
});
