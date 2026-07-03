/**
 * Build a matchable route table from a "file tree" — the same idea Next.js / Remix / SvelteKit use,
 * done from scratch with no fs and no router lib. We model the tree as an in-memory list of file
 * entries (so it stays deterministic and testable) and fold it into an ordered list of routes.
 *
 * A file entry looks like `{ path: "routes/cards/[id]/page", kind: "page" }`:
 *   - the FIRST path part is the root dir (`routes`), the LAST is the marker (`page` / `layout`);
 *   - the parts in between are the URL segments, where `[id]` is a DYNAMIC segment and `[...slug]`
 *     is a CATCH-ALL.
 *
 * Each `page` entry becomes one `Route`. Its `layoutChain` is every `layout` whose directory is an
 * ancestor of (or equal to) the page's directory, ordered root→leaf — that is the nesting order the
 * renderer wraps outermost-first. Routes come back sorted MOST-SPECIFIC first (higher `score`), so a
 * static `/cards/new` sits ahead of a dynamic `/cards/[id]` and wins on a conflict.
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

/** How much each segment kind contributes to specificity — static outranks dynamic outranks catch-all. */
const KIND_WEIGHT: Record<Segment["type"], number> = {
  static: 3,
  dynamic: 2,
  catchall: 1,
};

/** Split a file path into its directory parts (dropping the root dir and the trailing marker). */
function dirPartsOf(path: string): string[] {
  return path.split("/").slice(1, -1);
}

/** Turn one directory part into a URL segment: `[...slug]` → catch-all, `[id]` → dynamic, else static. */
function parseSegment(part: string): Segment {
  if (part.startsWith("[...") && part.endsWith("]")) {
    return { type: "catchall", name: part.slice(4, -1) };
  }
  if (part.startsWith("[") && part.endsWith("]")) {
    return { type: "dynamic", name: part.slice(1, -1) };
  }
  return { type: "static", value: part };
}

/** Is `prefix` an element-wise prefix of `parts`? (an ancestor directory of a page directory). */
function isPrefix(prefix: string[], parts: string[]): boolean {
  if (prefix.length > parts.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== parts[i]) return false;
  }
  return true;
}

/** Positional score: earlier + more-static segments dominate, so the table sorts most-specific first. */
function scoreOf(segments: Segment[], maxDepth: number): number {
  let score = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    score += KIND_WEIGHT[seg.type] * Math.pow(10, maxDepth - i);
  }
  return score;
}

export function buildRouteTable(files: FileEntry[]): Route[] {
  const layouts = files.filter((f) => f.kind === "layout");
  const pages = files.filter((f) => f.kind === "page");

  // Precompute each page's segments so we can find the max depth for a stable, comparable score.
  const parsed = pages.map((page) => {
    const parts = dirPartsOf(page.path);
    return { page, parts, segments: parts.map(parseSegment) };
  });
  const maxDepth = parsed.reduce((max, p) => Math.max(max, p.segments.length), 0);

  const routes: Route[] = parsed.map(({ page, parts, segments }) => {
    const paramNames = segments.flatMap((seg) =>
      seg.type === "static" ? [] : [seg.name],
    );
    const layoutChain = layouts
      .filter((layout) => isPrefix(dirPartsOf(layout.path), parts))
      .sort((a, b) => dirPartsOf(a.path).length - dirPartsOf(b.path).length)
      .map((layout) => layout.path);

    return {
      segments,
      paramNames,
      layoutChain,
      pagePath: page.path,
      score: scoreOf(segments, maxDepth),
    };
  });

  // Most-specific first; tie-break on path so the ordering is deterministic.
  return routes.sort((a, b) => b.score - a.score || a.pagePath.localeCompare(b.pagePath));
}
