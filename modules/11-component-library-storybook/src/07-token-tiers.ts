/**
 * Token tiers: primitive → semantic → component.
 *
 * The flat tokens in task 2 don't scale. Real design systems layer tokens:
 *   - primitive  the raw palette — the ONLY tier that stores a real color:  indigo-600 = #4f46e5
 *   - semantic   a role alias — what the color MEANS:                        action = indigo-600
 *   - component  a per-component slot:                                       button-bg = action
 * A component references `button-bg`; reskinning is one edit at the semantic layer.
 *
 * YOUR TURN — implement both functions:
 *   resolveToken(name, tokens):
 *     1. Walk a chain: if `name` is a primitive, return its {light,dark} value.
 *     2. Otherwise follow `component[name] ?? semantic[name]` to the next name and repeat.
 *     3. Track visited names in a Set; a repeat is a cycle → throw `Cyclic token alias: …`.
 *     4. A name that is neither a primitive nor an alias → throw `Unknown token: <name>`.
 *   resolveTokens(tokens, scheme):
 *     5. For every semantic + component name, emit `"--name" -> resolveToken(name)[scheme]`.
 *        (Primitives are omitted — components consume roles, not the raw palette.)
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

export function resolveToken(_name: string, _tokens: TieredTokens): SchemeValue {
  throw new Error(
    "TODO: follow component → semantic → primitive; throw on cycle/unknown",
  );
}

export function resolveTokens(
  _tokens: TieredTokens,
  _scheme: Scheme,
): Record<string, string> {
  throw new Error(
    "TODO: resolve every semantic + component token to `--name` for this scheme",
  );
}
