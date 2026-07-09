import { describe, expect, it } from "vitest";
import { maxWidthQuery, minWidthQuery } from "../solution/01-breakpoints.js";

describe("minWidthQuery (mobile-first)", () => {
  it("emits a min-width query at the breakpoint's pixel value", () => {
    expect(minWidthQuery("md")).toBe("@media (min-width: 768px)");
    expect(minWidthQuery("xl")).toBe("@media (min-width: 1280px)");
  });
});

describe("maxWidthQuery (desktop-first)", () => {
  it("caps at one pixel below the breakpoint so it never overlaps the min-width query", () => {
    expect(maxWidthQuery("md")).toBe("@media (max-width: 767px)");
    expect(maxWidthQuery("lg")).toBe("@media (max-width: 1023px)");
  });
});
