import { describe, expect, it } from "vitest";
import { applyPatch, indexById } from "../solution/07-utility-types.js";

describe("applyPatch", () => {
  it("overrides only the patched fields", () => {
    const user = { id: "1", name: "Ada", email: "ada@x.com" };
    expect(applyPatch(user, { name: "Grace" })).toEqual({
      id: "1",
      name: "Grace",
      email: "ada@x.com",
    });
  });
  it("returns the base unchanged for an empty patch", () => {
    expect(applyPatch({ a: 1, b: 2 }, {})).toEqual({ a: 1, b: 2 });
  });
});

describe("indexById", () => {
  it("keys each item by its id", () => {
    const list = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ];
    expect(indexById(list)).toEqual({ a: { id: "a", n: 1 }, b: { id: "b", n: 2 } });
  });
});
