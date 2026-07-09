/**
 * Token tiers: primitive → semantic → component.
 *
 * The flat tokens in task 2 don't scale. To add a brand, a high-contrast mode, or to retheme a
 * button, you'd edit every place a raw color is used. Real design systems layer tokens:
 *   - primitive  the raw palette — the ONLY tier that stores a real color:  indigo-600 = #4f46e5
 *   - semantic   a role alias — what the color MEANS:                        action = indigo-600
 *   - component  a per-component slot:                                       button-bg = action
 * A component references `button-bg`; reskinning is one edit at the semantic layer, and every
 * component that shares the role moves with it. `resolveToken` walks a name down the alias chain
 * to its concrete primitive value (both schemes); `resolveTokens` emits the CSS-variable map for
 * one scheme.
 */

export type Scheme = "light" | "dark";

/** Both-scheme concrete values. A primitive is the only tier that holds real colors. */
export interface SchemeValue {
  light: string;
  dark: string;
}

export interface TieredTokens {
  /** The raw palette. Every alias chain bottoms out here. */
  primitives: Record<string, SchemeValue>;
  /** Role aliases: each maps to a primitive name (or another semantic name). */
  semantic: Record<string, string>;
  /** Component slots: each maps to a semantic name (or a primitive). Optional. */
  component?: Record<string, string>;
}

/**
 * Resolve one token name to its concrete both-scheme value by following the alias chain
 * component → semantic → primitive. Throws on an unknown name or an alias cycle.
 */
export function resolveToken(name: string, tokens: TieredTokens): SchemeValue {
  const seen = new Set<string>();
  let current = name;
  for (;;) {
    if (seen.has(current)) {
      throw new Error(`Cyclic token alias: ${[...seen, current].join(" → ")}`);
    }
    seen.add(current);
    const primitive = tokens.primitives[current];
    if (primitive) return primitive;
    const next = tokens.component?.[current] ?? tokens.semantic[current];
    if (next === undefined) throw new Error(`Unknown token: ${current}`);
    current = next;
  }
}

/**
 * The CSS-variable map for one scheme: every semantic + component token resolved to its concrete
 * value, keyed `--name`. Primitives are intentionally omitted — components consume roles, not the
 * raw palette — but the resolver still reaches them through the chain.
 */
export function resolveTokens(
  tokens: TieredTokens,
  scheme: Scheme,
): Record<string, string> {
  const names = [...Object.keys(tokens.semantic), ...Object.keys(tokens.component ?? {})];
  const out: Record<string, string> = {};
  for (const name of names) {
    out[`--${name}`] = resolveToken(name, tokens)[scheme];
  }
  return out;
}
