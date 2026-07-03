import { describe, expect, it } from "vitest";
import { getProp, pluck } from "../solution/09-keyof-getter.js";

describe("getProp", () => {
  it("returns the value at the given key", () => {
    const user = { id: "7", name: "Ada" };
    expect(getProp(user, "name")).toBe("Ada");
    expect(getProp(user, "id")).toBe("7");
  });
});

describe("pluck", () => {
  it("collects a single field across the list, in order", () => {
    const rows = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ];
    expect(pluck(rows, "id")).toEqual(["a", "b"]);
    expect(pluck(rows, "n")).toEqual([1, 2]);
  });
});
