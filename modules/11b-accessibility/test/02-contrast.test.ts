import { describe, expect, it } from "vitest";
import { contrastRatio, meetsWCAG } from "../solution/02-contrast.js";

describe("contrastRatio", () => {
  it("is 21:1 for black on white (the maximum)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
  it("is symmetric regardless of argument order", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });
  it("supports 3-digit hex", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });
  it("computes a known mid pair (#767676 on white ≈ 4.54)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });
});

describe("meetsWCAG", () => {
  it("enforces AA normal (4.5) vs large (3.0)", () => {
    expect(meetsWCAG(4.5, { level: "AA" })).toBe(true);
    expect(meetsWCAG(3.5, { level: "AA" })).toBe(false);
    expect(meetsWCAG(3.5, { level: "AA", largeText: true })).toBe(true);
  });
  it("enforces the stricter AAA threshold (7.0)", () => {
    expect(meetsWCAG(6.9, { level: "AAA" })).toBe(false);
    expect(meetsWCAG(7.0, { level: "AAA" })).toBe(true);
  });
});
