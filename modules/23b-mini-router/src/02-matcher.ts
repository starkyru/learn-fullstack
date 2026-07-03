import type { Route } from "./01-route-table.js";

/**
 * Match a pathname against the route table and extract its params. The table is already sorted
 * most-specific first, so returning the FIRST match is what makes static `/cards/new` beat dynamic
 * `/cards/[id]` (re-sort by score defensively in case the table arrives unsorted).
 *
 * YOUR TURN — implement `matchRoute`:
 *   - normalize the pathname into non-empty parts (a trailing slash and `/` collapse away).
 *   - for each route, compare segment-by-segment: static must equal the part; dynamic captures one
 *     part into `params[name]`; a catch-all (only ever last) captures the remaining parts joined by
 *     "/" and needs at least one part. Non-catch-all routes must match the part count exactly.
 *   - return `{ route, params, layoutChain }` for the first match, else `null`.
 */

export interface MatchResult {
  route: Route;
  params: Record<string, string>;
  layoutChain: string[];
}

export function matchRoute(_table: Route[], _pathname: string): MatchResult | null {
  throw new Error(
    "TODO: normalize the path and return the first matching route + params",
  );
}
