import { describe, expect, it } from "vitest";
import { flip, invert, transformOf, type Rect } from "../solution/02-flip.js";

describe("FLIP from scratch", () => {
  const first: Rect = { x: 10, y: 10, width: 100, height: 40 };
  const last: Rect = { x: 30, y: 90, width: 50, height: 80 };

  it("invert maps last → first: translate = first-last, scale = first/last", () => {
    expect(invert(first, last)).toEqual({ dx: -20, dy: -80, sx: 2, sy: 0.5 });
  });

  it("transformOf serializes the delta to a CSS transform", () => {
    expect(transformOf({ dx: -20, dy: -80, sx: 2, sy: 0.5 })).toBe(
      "translate(-20px, -80px) scale(2, 0.5)",
    );
  });

  it("flip pins from = inverted transform and plays to = identity", () => {
    expect(flip(first, last)).toEqual({
      from: "translate(-20px, -80px) scale(2, 0.5)",
      to: "translate(0px, 0px) scale(1, 1)",
      isNoop: false,
    });
  });

  it("flip is NOT a no-op for a scale-only change (same x/y, different size)", () => {
    const scaleFirst: Rect = { x: 10, y: 10, width: 100, height: 40 };
    const scaleLast: Rect = { x: 10, y: 10, width: 50, height: 80 };
    const play = flip(scaleFirst, scaleLast);
    // dx=dy=0 but sx=100/50=2, sy=40/80=0.5 → scale still needs inverting.
    expect(play.isNoop).toBe(false);
    expect(play.from).toBe("translate(0px, 0px) scale(2, 0.5)");
  });

  it("flip is a no-op when the rects are equal", () => {
    const same: Rect = { x: 5, y: 5, width: 20, height: 20 };
    expect(flip(same, { ...same })).toEqual({
      from: "translate(0px, 0px) scale(1, 1)",
      to: "translate(0px, 0px) scale(1, 1)",
      isNoop: true,
    });
  });

  it("invert guards a zero-size last rect by scaling 1 (no divide-by-zero)", () => {
    expect(
      invert({ x: 0, y: 0, width: 100, height: 40 }, { x: 4, y: 8, width: 0, height: 0 }),
    ).toEqual({ dx: -4, dy: -8, sx: 1, sy: 1 });
  });
});
