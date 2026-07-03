/**
 * Design tokens → Tailwind preset + runtime CSS variables.
 *
 * The trick that makes one class (`bg-brand`) theme both schemes: the Tailwind color does NOT
 * hold a hex value, it holds `var(--brand)`. The hex lives in a CSS variable that a themed root
 * (`[data-theme="dark"]`) overrides. So light/dark is a variable swap — no rebuild, no `dark:`
 * duplicate of every class.
 *
 * YOUR TURN — implement both functions:
 *   tokensToPreset: for every color name, emit `name -> "var(--name)"`.
 *   themeVars:      for every token, emit `"--name" -> token[scheme]`.
 */

export type Scheme = "light" | "dark";

export interface ColorToken {
  light: string;
  dark: string;
}

export interface Tokens {
  colors: Record<string, ColorToken>;
}

export interface TailwindPreset {
  theme: { extend: { colors: Record<string, string> } };
}

export function tokensToPreset(_tokens: Tokens): TailwindPreset {
  throw new Error("TODO: map each color name to var(--name)");
}

export function themeVars(_tokens: Tokens, _scheme: Scheme): Record<string, string> {
  throw new Error("TODO: map each token to its --name / scheme value");
}
