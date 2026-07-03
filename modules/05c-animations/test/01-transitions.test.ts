import { describe, expect, it } from "vitest";
import {
  buildTransition,
  enterKeyframes,
  enterStyle,
  hoverStyle,
  usesOnlyCompositorProps,
} from "../solution/01-transitions.js";

describe("transition + keyframe builders (compositor-only)", () => {
  it("buildTransition joins each property with its duration + easing", () => {
    expect(buildTransition(["transform", "opacity"], 240, "ease-out")).toBe(
      "transform 240ms ease-out, opacity 240ms ease-out",
    );
  });

  it("hoverStyle (worked example) lifts + scales via transform only", () => {
    expect(hoverStyle()).toEqual({
      transform: "translateY(-4px) scale(1.02)",
      transition: "transform 200ms ease-out",
      willChange: "transform",
    });
  });

  it("enterStyle returns the hidden/visible fade-and-rise as opacity + transform", () => {
    expect(enterStyle("hidden")).toEqual({
      opacity: 0,
      transform: "translateY(8px)",
      transition: "transform 240ms ease-out, opacity 240ms ease-out",
      willChange: "transform, opacity",
    });
    expect(enterStyle("visible")).toEqual({
      opacity: 1,
      transform: "translateY(0px)",
      transition: "transform 240ms ease-out, opacity 240ms ease-out",
      willChange: "transform, opacity",
    });
  });

  it("enterKeyframes derives the from/to pair from enterStyle", () => {
    expect(enterKeyframes({ rise: 12 })).toEqual({
      from: { opacity: 0, transform: "translateY(12px)" },
      to: { opacity: 1, transform: "translateY(0px)" },
    });
  });

  it("usesOnlyCompositorProps accepts transform/opacity styles", () => {
    expect(usesOnlyCompositorProps(hoverStyle())).toBe(true);
    expect(usesOnlyCompositorProps(enterStyle("hidden"))).toBe(true);
  });

  it("usesOnlyCompositorProps rejects a layout key or a layout-animating transition", () => {
    expect(usesOnlyCompositorProps({ top: "4px", opacity: 1 })).toBe(false);
    expect(usesOnlyCompositorProps({ transition: "width 200ms ease-out" })).toBe(false);
  });

  it("usesOnlyCompositorProps matches whole prop tokens, not substrings (word boundary)", () => {
    // "--desktop-pan" contains "top" as a substring, but it is not the layout prop `top`.
    // The guard keys on `${prop} ` (trailing space), so this must stay compositor-safe.
    expect(
      usesOnlyCompositorProps({
        transform: "translateX(0px)",
        transition: "transform 200ms ease-out, --desktop-pan 200ms ease-out",
      }),
    ).toBe(true);
  });
});
