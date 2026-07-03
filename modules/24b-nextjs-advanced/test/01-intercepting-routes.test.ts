import { describe, expect, it } from "vitest";
import {
  matchPattern,
  resolveRoute,
  type RouteConfig,
} from "../solution/01-intercepting-routes.js";

const config: RouteConfig = {
  pages: ["/", "/settings", "/cards/[id]"],
  intercepts: [{ pattern: "/cards/[id]", slot: "@modal" }],
};

describe("matchPattern", () => {
  it("captures a dynamic [param] and decodes it", () => {
    expect(matchPattern("/cards/[id]", "/cards/42")).toEqual({ id: "42" });
    expect(matchPattern("/cards/[id]", "/cards/a%20b")).toEqual({ id: "a b" });
  });

  it("returns null when the segment count or a static segment differs", () => {
    expect(matchPattern("/cards/[id]", "/cards/42/edit")).toBeNull();
    expect(matchPattern("/cards/[id]", "/decks/42")).toBeNull();
  });
});

describe("resolveRoute", () => {
  it("soft nav to an intercepted path renders the MODAL slot", () => {
    expect(resolveRoute("/cards/42", "soft", config)).toEqual({
      render: "modal",
      slot: "@modal",
      segment: "/cards/[id]",
      params: { id: "42" },
    });
  });

  it("hard nav (deep-link) to the same path renders the full PAGE", () => {
    expect(resolveRoute("/cards/42", "hard", config)).toEqual({
      render: "page",
      slot: "children",
      segment: "/cards/[id]",
      params: { id: "42" },
    });
  });

  it("soft nav to a path with no interceptor still renders a full page", () => {
    expect(resolveRoute("/settings", "soft", config)).toEqual({
      render: "page",
      slot: "children",
      segment: "/settings",
      params: {},
    });
  });

  it("resolves the root '/' page", () => {
    expect(resolveRoute("/", "soft", config)).toEqual({
      render: "page",
      slot: "children",
      segment: "/",
      params: {},
    });
  });

  it("throws when no page route matches", () => {
    expect(() => resolveRoute("/nope/x/y", "soft", config)).toThrow(/no route/);
  });
});
