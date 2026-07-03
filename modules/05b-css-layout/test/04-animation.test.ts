import { describe, expect, it } from "vitest";
import {
  cardDropKeyframes,
  dropAnimation,
  shouldAnimate,
  transition,
} from "../solution/04-animation.js";

describe("shouldAnimate (reduced-motion gate)", () => {
  it("returns the animated timing when motion is allowed", () => {
    expect(shouldAnimate(false)).toEqual({
      duration: 200,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
  });

  it("collapses to instant (duration 0) under reduced motion", () => {
    expect(shouldAnimate(true)).toEqual({ duration: 0, easing: "linear" });
  });
});

describe("cardDropKeyframes", () => {
  it("drops in from above with a fade", () => {
    expect(cardDropKeyframes()).toEqual({
      from: { opacity: "0", transform: "translateY(-8px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    });
  });
});

describe("transition (shorthand builder)", () => {
  it("builds a multi-property transition from a timing", () => {
    expect(transition(["opacity", "transform"], shouldAnimate(false))).toBe(
      "opacity 200ms cubic-bezier(0.2, 0, 0, 1), transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    );
  });

  it("reduced motion makes every transition 0ms", () => {
    expect(transition(["opacity"], shouldAnimate(true))).toBe("opacity 0ms linear");
  });
});

describe("dropAnimation (composed style)", () => {
  it("emits the keyframe animation when motion is allowed", () => {
    expect(dropAnimation(shouldAnimate(false))).toEqual({
      animation: "card-drop 200ms cubic-bezier(0.2, 0, 0, 1) both",
    });
  });

  it("emits animation:none under reduced motion", () => {
    expect(dropAnimation(shouldAnimate(true))).toEqual({ animation: "none" });
  });
});
