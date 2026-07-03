import { describe, expect, it } from "vitest";
import { err, ok, pick } from "../solution/02-generics.js";

describe("Result helpers", () => {
  it("ok wraps a value", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });
  it("err wraps an error", () => {
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });
});

describe("pick", () => {
  it("copies only the requested keys", () => {
    const obj = { id: "1", name: "Ada", secret: "x" };
    expect(pick(obj, ["id", "name"])).toEqual({ id: "1", name: "Ada" });
  });
  it("returns an object without the omitted keys", () => {
    expect(Object.keys(pick({ a: 1, b: 2 }, ["a"]))).toEqual(["a"]);
  });
});
