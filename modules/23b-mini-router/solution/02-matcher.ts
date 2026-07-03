import type { Route } from "./01-route-table.js";

/**
 * Match a pathname against the route table and pull out the params. Because `buildRouteTable` sorts
 * the table most-specific first, we simply take the FIRST route that matches — that is what makes a
 * static `/cards/new` beat a dynamic `/cards/[id]`. We defensively re-sort by score in case a caller
 * hands us an unsorted table.
 *
 *   - a trailing slash is normalized away (`/cards/42/` === `/cards/42`, `/` === "").
 *   - a DYNAMIC segment captures exactly one path part into `params[name]`.
 *   - a CATCH-ALL segment (only ever last) swallows the remaining parts, joined by "/", and requires
 *     at least one part to be present.
 *   - no route matches → `null`.
 *
 * The match also carries the route's `layoutChain` (root→leaf) so the renderer can wrap the page.
 */

export interface MatchResult {
  route: Route;
  params: Record<string, string>;
  layoutChain: string[];
}

/** Split a pathname into its non-empty parts: `/cards/42/` → `["cards", "42"]`, `/` → `[]`. */
function normalize(pathname: string): string[] {
  return pathname.split("/").filter((part) => part.length > 0);
}

/** Try one route's segments against the path parts; return the captured params or `null`. */
function tryMatch(
  segments: Route["segments"],
  parts: string[],
): Record<string, string> | null {
  const last = segments[segments.length - 1];
  const hasCatchall = last !== undefined && last.type === "catchall";
  const fixedLen = hasCatchall ? segments.length - 1 : segments.length;

  // Without a catch-all the counts must be identical; with one, we need the fixed prefix plus ≥1 more.
  if (hasCatchall ? parts.length < fixedLen + 1 : parts.length !== segments.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < fixedLen; i++) {
    const seg = segments[i];
    const part = parts[i];
    if (!seg || part === undefined) return null;
    if (seg.type === "static") {
      if (seg.value !== part) return null;
    } else if (seg.type === "dynamic") {
      params[seg.name] = part;
    } else {
      return null; // a catch-all is only ever the final segment
    }
  }

  if (last !== undefined && last.type === "catchall") {
    params[last.name] = parts.slice(fixedLen).join("/");
  }
  return params;
}

export function matchRoute(table: Route[], pathname: string): MatchResult | null {
  const parts = normalize(pathname);
  const ordered = [...table].sort((a, b) => b.score - a.score);
  for (const route of ordered) {
    const params = tryMatch(route.segments, parts);
    if (params) return { route, params, layoutChain: route.layoutChain };
  }
  return null;
}
