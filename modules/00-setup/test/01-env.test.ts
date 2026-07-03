import { describe, expect, it } from "vitest";
// Tests target the reference in `solution/`. To check YOUR work, switch to "../src/01-env.js".
import { requireEnv } from "../solution/01-env.js";

describe("requireEnv", () => {
  it("returns the value when the key is set", () => {
    expect(requireEnv("FOO", { FOO: "bar" })).toBe("bar");
  });

  it("throws a readable error naming the missing key", () => {
    expect(() => requireEnv("MISSING", {})).toThrow(/Missing required env: MISSING/);
  });

  it("treats an empty string as missing", () => {
    expect(() => requireEnv("FOO", { FOO: "" })).toThrow(/FOO/);
  });
});
