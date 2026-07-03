/**
 * Theming with CSS custom properties: a theme is a MAP of `--var → value` you set on a root element;
 * swapping the map swaps every color at once (components read `var(--color-bg)`, never a literal).
 * The two decisions are pure and testable: (1) what map does a theme name produce, and (2) which
 * theme actually applies given the OS `prefers-color-scheme` and an explicit user override.
 *
 * YOUR TURN — implement both (delete the throws):
 *
 *   buildThemeVars(theme): return the custom-property map for THEMES[theme]:
 *     { "--color-bg": t.bg, "--color-fg": t.fg, "--color-accent": t.accent, "--color-muted": t.muted }
 *
 *   resolveTheme(prefersDark, override):
 *     - override "light" or "dark" WINS (explicit user choice beats the OS).
 *     - override "system" (the default) defers to the OS: prefersDark ? "dark" : "light".
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

export function buildThemeVars(_theme: ThemeName): Record<string, string> {
  throw new Error(
    'TODO: return { "--color-bg": t.bg, "--color-fg": t.fg, "--color-accent": t.accent, "--color-muted": t.muted }',
  );
}

export function resolveTheme(
  _prefersDark: boolean,
  _override: ThemeOverride = "system",
): ThemeName {
  throw new Error("TODO: explicit override wins; 'system' defers to prefersDark");
}
