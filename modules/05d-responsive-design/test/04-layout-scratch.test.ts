import { describe, expect, it } from "vitest";
import { sidebarMode } from "../solution/04-layout-scratch.js";

describe("sidebarMode", () => {
  it("is an off-canvas drawer below the lg breakpoint", () => {
    expect(sidebarMode(320)).toBe("drawer");
    expect(sidebarMode(1023)).toBe("drawer");
  });

  it("becomes a fixed sidebar at and above lg (1024)", () => {
    expect(sidebarMode(1024)).toBe("fixed");
    expect(sidebarMode(1440)).toBe("fixed");
  });
});
