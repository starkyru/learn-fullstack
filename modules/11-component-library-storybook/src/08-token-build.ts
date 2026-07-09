/**
 * Build design tokens from the W3C DTCG format (the interop JSON Tokens Studio / Figma export and
 * Style Dictionary consumes) — BY HAND. A DTCG document is nested groups; a token is
 * `{ "$value": ..., "$type": ... }`. A value may be an ALIAS `"{group.sub.name}"` pointing at
 * another token by its dotted path.
 *
 * 🔴 FROM SCRATCH — NO `style-dictionary`, NO Tokens Studio SDK. Implement three functions:
 *   flattenDtcg(doc, prefix=""):
 *     1. If the node has a string `$value`, it's a token → return `{ [prefix]: node.$value }`.
 *     2. Else it's a group: for each key (skip keys starting with `$` — group metadata), recurse
 *        with the dotted path `prefix ? prefix.key : key` and merge.
 *   resolveDtcg(doc):
 *     3. Flatten, then for each path resolve `{alias}` values: match `^\{(.+)\}$`, look the ref up,
 *        and recurse until a concrete literal. Track visited refs → cycle throws
 *        `Cyclic token reference: …`; a missing path throws `Unknown token reference: <path>`.
 *   toCssVars(resolved, selector=":root"):
 *     4. Emit `selector { --dashed-path: value; … }` — dotted paths become `--a-b-c`.
 */

export interface DtcgToken {
  $value: string;
  $type?: string;
}

/** A DTCG node is either a token (has `$value`) or a group of nested nodes. */
export type DtcgNode = DtcgToken | { [key: string]: DtcgNode };

export function flattenDtcg(_doc: DtcgNode, _prefix = ""): Record<string, string> {
  throw new Error("TODO: walk nested groups to a dotted-path → raw $value map");
}

export function resolveDtcg(_doc: DtcgNode): Record<string, string> {
  throw new Error("TODO: flatten then resolve every {alias} to a concrete value");
}

export function toCssVars(
  _resolved: Record<string, string>,
  _selector = ":root",
): string {
  throw new Error("TODO: emit `selector { --dashed-path: value; }`");
}
