/**
 * Parallel + intercepting routes, modeled as pure data — no Next runtime.
 *
 * In the App Router a *parallel route* renders a named slot (e.g. `@modal`) alongside `children`.
 * An *intercepting route* (`(.)cards/[id]` inside that slot) hijacks a navigation so the target
 * renders in the slot instead of as a full page — but ONLY on a *soft* (client-side `<Link>`)
 * navigation. A *hard* navigation (deep-link, refresh, opening the URL fresh) bypasses the
 * interception and renders the real full page. That soft-vs-hard fork is the whole behaviour we
 * model here.
 *
 * `resolveRoute(path, nav, config)` returns which slot renders and whether it is a `"modal"`
 * (intercepted) or a full `"page"`.
 */

export type NavKind = "soft" | "hard";

/** An intercepting route: a dynamic pattern that, on soft nav, renders into a parallel slot. */
export interface InterceptRoute {
  /** e.g. `"/cards/[id]"` — the pattern the `(.)` interceptor shadows. */
  pattern: string;
  /** the parallel slot it renders into, e.g. `"@modal"`. */
  slot: string;
}

export interface RouteConfig {
  /** full-page routes rendered into the `children` slot, e.g. `["/", "/cards/[id]"]`. */
  pages: string[];
  /** interceptors keyed by the pattern they shadow. */
  intercepts: InterceptRoute[];
}

export interface RouteResolution {
  /** `"modal"` = intercepted into a parallel slot; `"page"` = the real full page. */
  render: "modal" | "page";
  /** `"@modal"` for an interception, otherwise `"children"`. */
  slot: string;
  /** the matched route pattern, e.g. `"/cards/[id]"`. */
  segment: string;
  /** captured dynamic params, e.g. `{ id: "42" }`. */
  params: Record<string, string>;
}

/**
 * Match a route `pattern` (with `[param]` segments) against a concrete `path`.
 * Returns the captured params, or `null` when the shape does not match.
 */
export function matchPattern(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pSeg = pattern.split("/").filter(Boolean);
  const uSeg = path.split("/").filter(Boolean);
  if (pSeg.length !== uSeg.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    const patternSeg = pSeg[i]!;
    const urlSeg = uSeg[i]!;
    const dynamic = /^\[(.+)\]$/.exec(patternSeg);
    if (dynamic) {
      params[dynamic[1]!] = decodeURIComponent(urlSeg);
      continue;
    }
    if (patternSeg !== urlSeg) return null;
  }
  return params;
}

/**
 * Resolve a navigation to `path` under `config`.
 *  - a soft nav to a path an interceptor shadows → render as a MODAL in that parallel slot;
 *  - a hard nav (deep-link) to the same path → render the full PAGE (interception bypassed);
 *  - any path with no interceptor → the full page.
 * Throws when no page route matches `path`.
 */
export function resolveRoute(
  path: string,
  nav: NavKind,
  config: RouteConfig,
): RouteResolution {
  const page = config.pages.find((p) => matchPattern(p, path) !== null);
  if (!page) throw new Error(`no route for ${path}`);
  const params = matchPattern(page, path)!;

  if (nav === "soft") {
    const intercept = config.intercepts.find(
      (i) => matchPattern(i.pattern, path) !== null,
    );
    if (intercept) {
      return {
        render: "modal",
        slot: intercept.slot,
        segment: intercept.pattern,
        params,
      };
    }
  }

  return { render: "page", slot: "children", segment: page, params };
}
