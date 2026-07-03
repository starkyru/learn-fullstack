import { describe, expect, it } from "vitest";
import { themeVars, tokensToPreset, type Tokens } from "../solution/02-theming.js";

const TOKENS: Tokens = {
  colors: {
    brand: { light: "#4f46e5", dark: "#818cf8" },
    "brand-fg": { light: "#ffffff", dark: "#0b1020" },
    surface: { light: "#f3f4f6", dark: "#1f2937" },
  },
};

describe("tokensToPreset", () => {
  it("maps every token to a CSS-variable reference (not a hex)", () => {
    expect(tokensToPreset(TOKENS).theme.extend.colors).toEqual({
      brand: "var(--brand)",
      "brand-fg": "var(--brand-fg)",
      surface: "var(--surface)",
    });
  });
});

describe("themeVars", () => {
  it("emits the light palette keyed by CSS-variable name", () => {
    expect(themeVars(TOKENS, "light")).toEqual({
      "--brand": "#4f46e5",
      "--brand-fg": "#ffffff",
      "--surface": "#f3f4f6",
    });
  });

  it("emits the dark palette from the same tokens (proves the scheme switch)", () => {
    const dark = themeVars(TOKENS, "dark");
    expect(dark["--brand"]).toBe("#818cf8");
    expect(dark["--surface"]).toBe("#1f2937");
    // Same variable name, different value → a themed root only overrides the value.
    expect(dark["--brand"]).not.toBe(themeVars(TOKENS, "light")["--brand"]);
  });
});
