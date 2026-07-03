import type { ReactNode } from "react";

export type Theme = "light" | "dark";

/**
 * YOUR TURN — a SPLIT-context theme provider that minimizes re-renders.
 * Create TWO contexts: one holding the current `Theme` (changes often) and one holding the
 * stable `setTheme` setter. Provide both from `ThemeProvider({children})` (hold the state
 * with `useState`; render `children` between the providers so they aren't re-created).
 * Export hooks `useThemeState()` and `useThemeSetter()`.
 * The point: a component that only calls the setter must NOT re-render when the theme changes.
 */
export function ThemeProvider(_props: { children: ReactNode }) {
  throw new Error("TODO: two contexts (state + setter) + provider + hooks");
}
export function useThemeState(): Theme {
  throw new Error("TODO: read the theme-state context");
}
export function useThemeSetter(): (theme: Theme) => void {
  throw new Error("TODO: read the theme-setter context");
}
