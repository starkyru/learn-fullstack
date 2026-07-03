/**
 * Theme system: a theme name → a `--var` map (swap the map, swap every color), plus the precedence
 * rule that decides which theme applies given `prefers-color-scheme` and an explicit user override.
 */

export type ThemeName = "light" | "dark";
export type ThemeOverride = ThemeName | "system";

export interface Theme {
  bg: string;
  fg: string;
  accent: string;
  muted: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  light: { bg: "#ffffff", fg: "#111827", accent: "#2563eb", muted: "#6b7280" },
  dark: { bg: "#111827", fg: "#f9fafb", accent: "#60a5fa", muted: "#9ca3af" },
};

export function buildThemeVars(theme: ThemeName): Record<string, string> {
  const t = THEMES[theme];
  return {
    "--color-bg": t.bg,
    "--color-fg": t.fg,
    "--color-accent": t.accent,
    "--color-muted": t.muted,
  };
}

export function resolveTheme(
  prefersDark: boolean,
  override: ThemeOverride = "system",
): ThemeName {
  if (override === "light" || override === "dark") return override;
  return prefersDark ? "dark" : "light";
}
