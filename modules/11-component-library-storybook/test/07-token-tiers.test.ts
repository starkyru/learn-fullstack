import { describe, expect, it } from "vitest";
import {
  resolveToken,
  resolveTokens,
  type TieredTokens,
} from "../solution/07-token-tiers.js";

const TOKENS: TieredTokens = {
  primitives: {
    "indigo-600": { light: "#4f46e5", dark: "#818cf8" },
    "slate-50": { light: "#f8fafc", dark: "#0f172a" },
    white: { light: "#ffffff", dark: "#ffffff" },
  },
  semantic: {
    action: "indigo-600",
    "action-fg": "white",
    surface: "slate-50",
  },
  component: {
    "button-bg": "action",
    "button-fg": "action-fg",
  },
};

describe("resolveToken", () => {
  it("walks component → semantic → primitive to the concrete both-scheme value", () => {
    // button-bg → action → indigo-600
    expect(resolveToken("button-bg", TOKENS)).toEqual({
      light: "#4f46e5",
      dark: "#818cf8",
    });
  });

  it("resolves a semantic role directly to its primitive", () => {
    expect(resolveToken("action-fg", TOKENS)).toEqual({
      light: "#ffffff",
      dark: "#ffffff",
    });
  });

  it("throws on an unknown token name", () => {
    expect(() => resolveToken("nope", TOKENS)).toThrow("Unknown token: nope");
  });

  it("throws on a cyclic alias instead of looping forever", () => {
    const cyclic: TieredTokens = {
      primitives: {},
      semantic: { a: "b" },
      component: { b: "a" },
    };
    expect(() => resolveToken("a", cyclic)).toThrow(/Cyclic token alias/);
  });
});

describe("resolveTokens", () => {
  it("emits the light CSS-variable map for every semantic + component token (not primitives)", () => {
    expect(resolveTokens(TOKENS, "light")).toEqual({
      "--action": "#4f46e5",
      "--action-fg": "#ffffff",
      "--surface": "#f8fafc",
      "--button-bg": "#4f46e5",
      "--button-fg": "#ffffff",
    });
  });

  it("emits the dark map from the same tokens — proving the tier collapse per scheme", () => {
    const dark = resolveTokens(TOKENS, "dark");
    expect(dark["--action"]).toBe("#818cf8"); // indigo-600.dark
    expect(dark["--surface"]).toBe("#0f172a"); // slate-50.dark
    // button-bg aliases action, so retheming action moves the button with no button edit:
    expect(dark["--button-bg"]).toBe(dark["--action"]);
  });
});
