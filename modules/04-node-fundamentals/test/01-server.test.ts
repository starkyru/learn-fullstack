import { describe, expect, it } from "vitest";
import { routeV2 } from "../solution/01-server.js";

describe("routeV2", () => {
  it("serves GET /version", () => {
    expect(routeV2("GET", "/version")).toEqual({
      status: 200,
      body: { version: "1.0.0" },
    });
  });
  it("still serves the inherited GET /health", () => {
    expect(routeV2("GET", "/health")).toEqual({ status: 200, body: { ok: true } });
  });
  it("404s an unknown path", () => {
    expect(routeV2("GET", "/nope").status).toBe(404);
  });
});
