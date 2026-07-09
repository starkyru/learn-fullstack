/**
 * Build design tokens from the W3C DTCG format (the interop JSON that Tokens Studio / Figma export
 * and that Style Dictionary consumes) — BY HAND. A DTCG document is nested groups of tokens; a
 * token is `{ "$value": ..., "$type": ... }`. A value may be an ALIAS `"{group.sub.name}"` that
 * points at another token by its dotted path. This module flattens the tree, resolves those
 * aliases, and emits CSS custom properties. No `style-dictionary`, no Tokens Studio SDK.
 */

export interface DtcgToken {
  $value: string;
  $type?: string;
}

/** A DTCG node is either a token (has `$value`) or a group of nested nodes. */
export type DtcgNode = DtcgToken | { [key: string]: DtcgNode };

function isToken(node: DtcgNode): node is DtcgToken {
  return typeof (node as DtcgToken).$value === "string";
}

/** Flatten nested groups to a dotted-path → raw `$value` map (aliases left unresolved). */
export function flattenDtcg(doc: DtcgNode, prefix = ""): Record<string, string> {
  if (isToken(doc)) return { [prefix]: doc.$value };
  const out: Record<string, string> = {};
  for (const [key, child] of Object.entries(doc)) {
    if (key.startsWith("$")) continue; // group-level metadata ($description, $type, …)
    const path = prefix ? `${prefix}.${key}` : key;
    Object.assign(out, flattenDtcg(child, path));
  }
  return out;
}

const ALIAS = /^\{([^}]+)\}$/;

/**
 * Flatten, then resolve every `{alias}` reference to a concrete value. Throws on an unknown
 * reference or an alias cycle.
 */
export function resolveDtcg(doc: DtcgNode): Record<string, string> {
  const flat = flattenDtcg(doc);
  const resolve = (path: string, seen: Set<string>): string => {
    const raw = flat[path];
    if (raw === undefined) throw new Error(`Unknown token reference: ${path}`);
    const match = ALIAS.exec(raw);
    if (!match) return raw; // a concrete literal, chain bottoms out
    const ref = match[1]!;
    if (seen.has(ref))
      throw new Error(`Cyclic token reference: ${[...seen, ref].join(" → ")}`);
    return resolve(ref, new Set(seen).add(ref));
  };
  const resolved: Record<string, string> = {};
  for (const path of Object.keys(flat)) resolved[path] = resolve(path, new Set([path]));
  return resolved;
}

/** Emit a CSS rule: dotted paths become `--dash-separated` custom properties under `selector`. */
export function toCssVars(resolved: Record<string, string>, selector = ":root"): string {
  const lines = Object.entries(resolved).map(
    ([path, value]) => `  --${path.replace(/\./g, "-")}: ${value};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}`;
}
