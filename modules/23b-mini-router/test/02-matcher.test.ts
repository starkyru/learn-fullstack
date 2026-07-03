import { describe, expect, it } from "vitest";
import { buildRouteTable, type FileEntry } from "../solution/01-route-table.js";
import { matchRoute } from "../solution/02-matcher.js";

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

const table = buildRouteTable(files);

describe("matchRoute", () => {
  it("captures a dynamic param and surfaces the leaf layout chain", () => {
    const match = matchRoute(table, "/cards/42");
    expect(match?.route.pagePath).toBe("routes/cards/[id]/page");
    expect(match?.params).toEqual({ id: "42" });
    expect(match?.layoutChain).toEqual([
      "routes/layout",
      "routes/cards/layout",
      "routes/cards/[id]/layout",
    ]);
  });

  it("prefers a static segment over a dynamic one on a conflict", () => {
    const match = matchRoute(table, "/cards/new");
    expect(match?.route.pagePath).toBe("routes/cards/new/page");
    expect(match?.params).toEqual({});
  });

  it("normalizes a trailing slash before matching", () => {
    const match = matchRoute(table, "/cards/42/");
    expect(match?.route.pagePath).toBe("routes/cards/[id]/page");
    expect(match?.params).toEqual({ id: "42" });
  });

  it("matches `/` to the index page", () => {
    const match = matchRoute(table, "/");
    expect(match?.route.pagePath).toBe("routes/page");
    expect(match?.params).toEqual({});
  });

  it("lets a catch-all swallow the remaining parts joined by `/`", () => {
    const match = matchRoute(table, "/blog/2026/07/hello");
    expect(match?.route.pagePath).toBe("routes/blog/[...slug]/page");
    expect(match?.params).toEqual({ slug: "2026/07/hello" });
  });

  it("re-sorts an unsorted table so the highest-specificity route still wins", () => {
    // Hand the matcher a table in the WRONG order (least-specific first): reversing the
    // most-specific-first table puts the dynamic `/cards/[id]` route ahead of the static
    // `/cards/new` route. Both match "/cards/new" (the dynamic one captures id="new"), so a
    // matcher that trusted the given order would wrongly return `[id]`. The re-sort must fix it.
    const unsorted = [...table].reverse();
    // Guard: the reversal really does put the dynamic route before the static one in the input.
    const dynamicIdx = unsorted.findIndex((r) => r.pagePath === "routes/cards/[id]/page");
    const staticIdx = unsorted.findIndex((r) => r.pagePath === "routes/cards/new/page");
    expect(dynamicIdx).toBeLessThan(staticIdx);

    const match = matchRoute(unsorted, "/cards/new");
    expect(match?.route.pagePath).toBe("routes/cards/new/page");
    expect(match?.params).toEqual({});
  });

  it("returns null when nothing matches", () => {
    expect(matchRoute(table, "/does/not/exist")).toBeNull();
    // A catch-all needs at least one part, so `/blog` alone (no slug) does not match.
    expect(matchRoute(table, "/blog")).toBeNull();
  });
});
