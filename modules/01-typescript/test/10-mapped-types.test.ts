import { describe, expect, it } from "vitest";
import { makeGetters } from "../solution/10-mapped-types.js";

describe("makeGetters", () => {
  it("builds a get<Key>() accessor per field that returns its value", () => {
    const g = makeGetters({ id: "7", name: "Ada" });
    expect(g.getId()).toBe("7");
    expect(g.getName()).toBe("Ada");
  });

  it("names accessors by capitalizing the key", () => {
    const g = makeGetters({ count: 3 });
    expect(Object.keys(g)).toEqual(["getCount"]);
    expect(g.getCount()).toBe(3);
  });
});
