import { describe, expect, it } from "vitest";
import {
  buildSizes,
  buildSrcSet,
  displayFont,
  optimizeImage,
} from "../solution/04-image-font.js";

describe("next/image + next/font optimization helpers", () => {
  it("buildSrcSet emits one candidate per width, exactly", () => {
    expect(buildSrcSet("/hero.jpg", [320, 640, 1280])).toBe(
      "/hero.jpg?w=320 320w, /hero.jpg?w=640 640w, /hero.jpg?w=1280 1280w",
    );
  });

  it("buildSizes turns entries into a media-query list with a trailing default", () => {
    expect(
      buildSizes([
        { minWidth: 1024, size: "640px" },
        { minWidth: 640, size: "50vw" },
        { size: "100vw" },
      ]),
    ).toBe("(min-width: 1024px) 640px, (min-width: 640px) 50vw, 100vw");
  });

  it("optimizeImage marks the LCP hero eager + high fetch priority", () => {
    expect(
      optimizeImage({
        src: "/hero.jpg",
        alt: "Board hero",
        widths: [320, 640, 1280],
        sizes: [{ minWidth: 640, size: "50vw" }, { size: "100vw" }],
        width: 1280,
        height: 720,
        priority: true,
      }),
    ).toEqual({
      src: "/hero.jpg?w=1280",
      alt: "Board hero",
      srcSet: "/hero.jpg?w=320 320w, /hero.jpg?w=640 640w, /hero.jpg?w=1280 1280w",
      sizes: "(min-width: 640px) 50vw, 100vw",
      width: 1280,
      height: 720,
      loading: "eager",
      fetchPriority: "high",
      decoding: "async",
    });
  });

  it("optimizeImage lazy-loads non-priority images with auto fetch priority", () => {
    const img = optimizeImage({
      src: "/thumb.jpg",
      alt: "Card thumb",
      widths: [96, 192],
      sizes: [{ size: "96px" }],
      width: 96,
      height: 96,
    });
    expect(img.loading).toBe("lazy");
    expect(img.fetchPriority).toBe("auto");
    expect(img.src).toBe("/thumb.jpg?w=192");
  });

  it("displayFont self-hosts with display:swap and a CSS variable", () => {
    expect(displayFont).toEqual({
      family: "Inter",
      subsets: ["latin"],
      weights: [400, 600, 700],
      display: "swap",
      variable: "--font-display",
      preload: true,
    });
  });
});
