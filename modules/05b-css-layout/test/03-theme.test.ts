import { describe, expect, it } from "vitest";
import { buildThemeVars, resolveTheme } from "../solution/03-theme.js";

describe("buildThemeVars", () => {
  it("maps the light theme to its custom-property set", () => {
    expect(buildThemeVars("light")).toEqual({
      "--color-bg": "#ffffff",
      "--color-fg": "#111827",
      "--color-accent": "#2563eb",
      "--color-muted": "#6b7280",
    });
  });

  it("maps the dark theme to a different set (one map swaps every color)", () => {
    expect(buildThemeVars("dark")).toEqual({
      "--color-bg": "#111827",
      "--color-fg": "#f9fafb",
      "--color-accent": "#60a5fa",
      "--color-muted": "#9ca3af",
    });
  });

  it("emits exactly the four documented properties", () => {
    expect(Object.keys(buildThemeVars("light"))).toEqual([
      "--color-bg",
      "--color-fg",
      "--color-accent",
      "--color-muted",
    ]);
  });
});

describe("resolveTheme (precedence)", () => {
  it("defers to the OS when override is 'system' (default)", () => {
    expect(resolveTheme(true)).toBe("dark");
    expect(resolveTheme(false)).toBe("light");
    expect(resolveTheme(true, "system")).toBe("dark");
  });

  it("lets an explicit override win over prefers-color-scheme", () => {
    expect(resolveTheme(true, "light")).toBe("light");
    expect(resolveTheme(false, "dark")).toBe("dark");
  });
});
