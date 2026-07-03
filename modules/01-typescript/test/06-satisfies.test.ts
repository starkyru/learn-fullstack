import { describe, expect, it } from "vitest";
import { colorOf, endpoint } from "../solution/06-satisfies.js";

describe("endpoint", () => {
  it("returns a service's url by its literal name", () => {
    expect(endpoint("auth")).toBe("/auth");
    expect(endpoint("billing")).toBe("/billing");
  });
});

describe("colorOf", () => {
  it("returns the hex for a theme token", () => {
    expect(colorOf("primary")).toBe("#2563eb");
    expect(colorOf("danger")).toBe("#dc2626");
  });
});
