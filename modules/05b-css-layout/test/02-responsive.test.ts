import { describe, expect, it } from "vitest";
import {
  fluidType,
  pickLayout,
  STACK_MAX,
  TWO_COL_MAX,
} from "../solution/02-responsive.js";

describe("pickLayout (container-query resolver)", () => {
  it("returns 'stack' below the stack threshold", () => {
    expect(pickLayout(0)).toBe("stack");
    expect(pickLayout(479)).toBe("stack");
  });

  it("switches to '2col' exactly at STACK_MAX (inclusive lower bound)", () => {
    expect(STACK_MAX).toBe(480);
    expect(pickLayout(480)).toBe("2col");
    expect(pickLayout(767)).toBe("2col");
  });

  it("switches to '3col' exactly at TWO_COL_MAX", () => {
    expect(TWO_COL_MAX).toBe(768);
    expect(pickLayout(768)).toBe("3col");
    expect(pickLayout(2000)).toBe("3col");
  });
});

describe("fluidType (clamp builder)", () => {
  it("builds a clean clamp when the numbers divide evenly", () => {
    expect(fluidType({ minPx: 16, maxPx: 32, minVw: 400, maxVw: 1200 })).toBe(
      "clamp(16px, 2vw + 8px, 32px)",
    );
  });

  it("rounds the slope and intercept to 4 decimals", () => {
    // slope = 8/960 = 0.0083333…; *100 → 0.8333; intercept = 16 - slope*320 → 13.3333
    expect(fluidType({ minPx: 16, maxPx: 24, minVw: 320, maxVw: 1280 })).toBe(
      "clamp(16px, 0.8333vw + 13.3333px, 24px)",
    );
  });

  it("keeps the raw min/max px as the clamp bounds", () => {
    expect(fluidType({ minPx: 14, maxPx: 20, minVw: 375, maxVw: 1440 })).toBe(
      "clamp(14px, 0.5634vw + 11.8873px, 20px)",
    );
  });

  it("passes fractional min/max px through UN-rounded (not clamped to 4 decimals)", () => {
    // minPx/maxPx carry 5 decimals, so 4-decimal round() would change them
    // (round(14.00005)=14.0001, round(22.00005)=22.0001). The bounds must stay raw.
    //   slope     = (22.00005 - 14.00005) / (1280 - 320) = 8/960 = 0.008333…
    //   slopeVw   = round(0.8333…)                        = 0.8333
    //   intercept = round(14.00005 - 0.008333…*320)
    //             = round(14.00005 - 2.66666…) = round(11.333383…) = 11.3334
    expect(fluidType({ minPx: 14.00005, maxPx: 22.00005, minVw: 320, maxVw: 1280 })).toBe(
      "clamp(14.00005px, 0.8333vw + 11.3334px, 22.00005px)",
    );
  });
});
