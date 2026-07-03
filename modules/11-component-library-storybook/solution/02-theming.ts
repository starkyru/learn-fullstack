/**
 * Design tokens → Tailwind preset + runtime CSS variables.
 *
 * The trick that makes one class (`bg-brand`) theme both schemes: the Tailwind color does NOT
 * hold a hex value, it holds `var(--brand)`. The hex lives in a CSS variable that a themed root
 * (`[data-theme="dark"]`) overrides. So light/dark is a variable swap — no rebuild, no `dark:`
 * duplicate of every class.
 */

export type Scheme = "light" | "dark";

/** Each token carries the value for both schemes. */
export interface ColorToken {
  light: string;
  dark: string;
}

export interface Tokens {
  colors: Record<string, ColorToken>;
}

/** The subset of a Tailwind config this module produces. */
export interface TailwindPreset {
  theme: { extend: { colors: Record<string, string> } };
}

/** `brand` → `var(--brand)` for every token, ready to spread into a Tailwind config. */
export function tokensToPreset(tokens: Tokens): TailwindPreset {
  const colors: Record<string, string> = {};
  for (const name of Object.keys(tokens.colors)) {
    colors[name] = `var(--${name})`;
  }
  return { theme: { extend: { colors } } };
}

/** The CSS variables for one scheme: `{ "--brand": "#4f46e5", … }`. Put these on the root. */
export function themeVars(tokens: Tokens, scheme: Scheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, token] of Object.entries(tokens.colors)) {
    vars[`--${name}`] = token[scheme];
  }
  return vars;
}
