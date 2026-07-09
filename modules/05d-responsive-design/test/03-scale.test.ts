import { describe, expect, it } from "vitest";
import { modularScale, pxToRem } from "../solution/03-scale.js";

describe("modularScale", () => {
  it("multiplies the base by the ratio raised to the step", () => {
    expect(modularScale(1, 1.25, 0)).toBe(1); // base
    expect(modularScale(1, 1.25, 2)).toBe(1.5625); // 1.25^2
    expect(modularScale(1, 1.25, -1)).toBe(0.8); // 1 / 1.25
  });
});

describe("pxToRem", () => {
  it("divides by the root font-size (default 16)", () => {
    expect(pxToRem(16)).toBe("1rem");
    expect(pxToRem(24)).toBe("1.5rem");
  });

  it("honors a custom root font-size", () => {
    expect(pxToRem(20, 10)).toBe("2rem");
  });
});
