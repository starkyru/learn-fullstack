import { describe, expect, it } from "vitest";
import { assertNever, corners } from "../solution/04-exhaustiveness.js";

describe("corners (exhaustive switch)", () => {
  it("returns the corner count for every Shape variant", () => {
    expect(corners({ kind: "circle", radius: 1 })).toBe(0);
    expect(corners({ kind: "rect", width: 2, height: 3 })).toBe(4);
    expect(corners({ kind: "square", side: 4 })).toBe(4);
  });
});

describe("assertNever", () => {
  it("throws when forced at runtime (it should be statically unreachable)", () => {
    // Cast only to exercise the runtime guard; the compiler forbids passing a real value.
    expect(() => assertNever("unreachable" as never)).toThrow(/Unhandled variant/);
  });
});
