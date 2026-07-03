import { describe, expect, it } from "vitest";
import {
  buildRouteTable,
  type FileEntry,
  type Route,
} from "../solution/01-route-table.js";

// A nested tree: a root layout, a cards section with its own layout, a static `new` page, a dynamic
// `[id]` page with a nested layout, and a catch-all blog page.
const files: FileEntry[] = [
  { path: "routes/layout", kind: "layout" },
  { path: "routes/page", kind: "page" },
  { path: "routes/cards/layout", kind: "layout" },
  { path: "routes/cards/page", kind: "page" },
  { path: "routes/cards/new/page", kind: "page" },
  { path: "routes/cards/[id]/layout", kind: "layout" },
  { path: "routes/cards/[id]/page", kind: "page" },
  { path: "routes/blog/[...slug]/page", kind: "page" },
];

function byPage(table: Route[], pagePath: string): Route {
  const route = table.find((r) => r.pagePath === pagePath);
  if (!route) throw new Error(`no route for ${pagePath}`);
  return route;
}

describe("buildRouteTable", () => {
  it("parses a dynamic page's segments, paramNames, and root→leaf layout chain", () => {
    const table = buildRouteTable(files);
    const route = byPage(table, "routes/cards/[id]/page");

    expect(route.segments).toEqual([
      { type: "static", value: "cards" },
      { type: "dynamic", name: "id" },
    ]);
    expect(route.paramNames).toEqual(["id"]);
    expect(route.layoutChain).toEqual([
      "routes/layout",
      "routes/cards/layout",
      "routes/cards/[id]/layout",
    ]);
  });

  it("gives a static page an empty paramNames and only the ancestor layouts", () => {
    const table = buildRouteTable(files);
    const route = byPage(table, "routes/cards/new/page");

    expect(route.segments).toEqual([
      { type: "static", value: "cards" },
      { type: "static", value: "new" },
    ]);
    expect(route.paramNames).toEqual([]);
    // The `[id]` layout is a sibling directory, so it must NOT wrap `/cards/new`.
    expect(route.layoutChain).toEqual(["routes/layout", "routes/cards/layout"]);
  });

  it("parses a catch-all segment and its param name", () => {
    const table = buildRouteTable(files);
    const route = byPage(table, "routes/blog/[...slug]/page");

    expect(route.segments).toEqual([
      { type: "static", value: "blog" },
      { type: "catchall", name: "slug" },
    ]);
    expect(route.paramNames).toEqual(["slug"]);
    expect(route.layoutChain).toEqual(["routes/layout"]);
  });

  it("wraps the index page in just the root layout", () => {
    const table = buildRouteTable(files);
    const route = byPage(table, "routes/page");

    expect(route.segments).toEqual([]);
    expect(route.paramNames).toEqual([]);
    expect(route.layoutChain).toEqual(["routes/layout"]);
  });

  it("scores a fully-static route above a same-shape dynamic one, and returns them sorted", () => {
    const table = buildRouteTable(files);
    const staticRoute = byPage(table, "routes/cards/new/page");
    const dynamicRoute = byPage(table, "routes/cards/[id]/page");

    expect(staticRoute.score).toBeGreaterThan(dynamicRoute.score);
    // The table is returned most-specific first, so `/cards/new` precedes `/cards/[id]`.
    expect(table.indexOf(staticRoute)).toBeLessThan(table.indexOf(dynamicRoute));
  });

  it("weighs a static segment MORE when it sits earlier (position 0 dominates position 1)", () => {
    // Two two-segment routes that differ only in WHERE the static vs dynamic sits:
    //   foo/[a]  → [static@0, dynamic@1]
    //   [b]/bar  → [dynamic@0, static@1]
    // Both match "/foo/bar", but a static at the FRONT is more specific, so foo/[a] must win.
    // Hand-derived with maxDepth=2 and weights {static:3, dynamic:2}:
    //   foo/[a] = 3*10^(2-0) + 2*10^(2-1) = 300 + 20 = 320
    //   [b]/bar = 2*10^(2-0) + 3*10^(2-1) = 200 + 30 = 230
    const positional: FileEntry[] = [
      { path: "routes/foo/[a]/page", kind: "page" },
      { path: "routes/[b]/bar/page", kind: "page" },
    ];
    const table = buildRouteTable(positional);
    const staticFirst = byPage(table, "routes/foo/[a]/page");
    const dynamicFirst = byPage(table, "routes/[b]/bar/page");

    expect(staticFirst.score).toBe(320);
    expect(dynamicFirst.score).toBe(230);
    expect(staticFirst.score).toBeGreaterThan(dynamicFirst.score);
    // Most-specific first: the static-at-position-0 route precedes the dynamic-at-position-0 one.
    expect(table.indexOf(staticFirst)).toBeLessThan(table.indexOf(dynamicFirst));
  });

  it("scores a dynamic segment STRICTLY above a catch-all at the same position", () => {
    // blog/[id]      → [static@0, dynamic@1]
    // blog/[...slug] → [static@0, catchall@1]
    // The two routes share the same static@0 head and differ ONLY at position 1 (dynamic vs
    // catch-all), so their score gap is exactly the weight gap at that position. For a single-part
    // path like "/blog/x" the dynamic route must win, so dynamic(2) must outrank catch-all(1).
    // Hand-derived gap at position 1 (10^(maxDepth-1) = 10^1 = 10): (2 - 1) * 10 = 10.
    const specificity: FileEntry[] = [
      { path: "routes/blog/[id]/page", kind: "page" },
      { path: "routes/blog/[...slug]/page", kind: "page" },
    ];
    const table = buildRouteTable(specificity);
    const dynamicRoute = byPage(table, "routes/blog/[id]/page");
    const catchallRoute = byPage(table, "routes/blog/[...slug]/page");

    expect(dynamicRoute.score - catchallRoute.score).toBe(10);
    expect(dynamicRoute.score).toBeGreaterThan(catchallRoute.score);
    // The dynamic route is more specific, so it precedes the catch-all in the sorted table.
    expect(table.indexOf(dynamicRoute)).toBeLessThan(table.indexOf(catchallRoute));
  });

  it("emits exactly one route per page entry", () => {
    const table = buildRouteTable(files);
    expect(table.map((r) => r.pagePath).sort()).toEqual([
      "routes/blog/[...slug]/page",
      "routes/cards/[id]/page",
      "routes/cards/new/page",
      "routes/cards/page",
      "routes/page",
    ]);
  });
});
