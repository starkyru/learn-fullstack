/**
 * Build a matchable route table from an in-memory "file tree" (a list of file entries), the way
 * Next.js / Remix / SvelteKit turn a `routes/` folder into routes — from scratch, no fs, no router lib.
 *
 * A file entry is `{ path: "routes/cards/[id]/page", kind: "page" }`: first part is the root dir, last
 * is the marker (`page` / `layout`), the parts between are URL segments where `[id]` is dynamic and
 * `[...slug]` is catch-all.
 *
 * YOUR TURN — implement `buildRouteTable`:
 *   1. Split files into `layout` entries and `page` entries.
 *   2. For each PAGE, parse its directory parts into segments (static / dynamic / catchall) and collect
 *      `paramNames` from the dynamic + catch-all segments, in order.
 *   3. `layoutChain`: every layout whose directory is a prefix of (ancestor of, or equal to) the page's
 *      directory, sorted root→leaf, mapped to their paths.
 *   4. `score`: static > dynamic > catchall, earlier segments weigh more (so `/cards/new` outranks
 *      `/cards/[id]`).
 *   5. Return the routes sorted MOST-SPECIFIC first (highest score), with a deterministic tie-break.
 */

export type FileKind = "page" | "layout";

export interface FileEntry {
  path: string;
  kind: FileKind;
}

export type Segment =
  | { readonly type: "static"; readonly value: string }
  | { readonly type: "dynamic"; readonly name: string }
  | { readonly type: "catchall"; readonly name: string };

export interface Route {
  segments: Segment[];
  paramNames: string[];
  layoutChain: string[];
  pagePath: string;
  score: number;
}

export function buildRouteTable(_files: FileEntry[]): Route[] {
  throw new Error("TODO: fold file entries into an ordered, scored route table");
}
