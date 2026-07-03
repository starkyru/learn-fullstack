import { describe, expect, it } from "vitest";
import { compact, isString } from "../solution/08-type-guards.js";

describe("isString", () => {
  it("is true only for strings", () => {
    expect(isString("hi")).toBe(true);
    expect(isString(5)).toBe(false);
    expect(isString(null)).toBe(false);
  });
});

describe("compact", () => {
  it("drops null/undefined and preserves order", () => {
    expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  });
});
