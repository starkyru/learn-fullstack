/**
 * Parallel + intercepting routes, modeled as pure data — no Next runtime.
 *
 * A *parallel route* renders a named slot (e.g. `@modal`) next to `children`. An *intercepting
 * route* (`(.)cards/[id]` inside that slot) hijacks a navigation so the target renders in the slot
 * instead of as a full page — but ONLY on a *soft* (client-side `<Link>`) navigation. A *hard*
 * navigation (deep-link, refresh) bypasses the interception and renders the real full page.
 *
 * YOUR TURN — implement the two functions below so:
 *   - `matchPattern(pattern, path)` returns captured `[param]` values, or `null` on a mismatch.
 *   - `resolveRoute(path, nav, config)`:
 *       · soft nav to an intercepted path → `{ render: "modal", slot: <the slot> }`;
 *       · hard nav to the same path       → `{ render: "page",  slot: "children" }`;
 *       · any path with no interceptor     → the full page;
 *       · throw when no page route matches.
 */

export type NavKind = "soft" | "hard";

export interface InterceptRoute {
  pattern: string;
  slot: string;
}

export interface RouteConfig {
  pages: string[];
  intercepts: InterceptRoute[];
}

export interface RouteResolution {
  render: "modal" | "page";
  slot: string;
  segment: string;
  params: Record<string, string>;
}

export function matchPattern(
  _pattern: string,
  _path: string,
): Record<string, string> | null {
  throw new Error("TODO: match [param] segments and capture params (or return null)");
}

export function resolveRoute(
  _path: string,
  _nav: NavKind,
  _config: RouteConfig,
): RouteResolution {
  throw new Error("TODO: fork soft (modal) vs hard (page) and resolve the slot");
}
