import { describe, expect, it } from "vitest";
import { label, type Shape } from "../solution/01-narrowing.js";

describe("label", () => {
  it("labels each shape variant", () => {
    expect(label({ kind: "circle", radius: 2 })).toBe("circle r=2");
    expect(label({ kind: "rect", width: 3, height: 4 })).toBe("rect 3x4");
    expect(label({ kind: "square", side: 5 })).toBe("square 5");
  });

  it("covers every variant of the union", () => {
    const shapes: Shape[] = [
      { kind: "circle", radius: 1 },
      { kind: "rect", width: 1, height: 1 },
      { kind: "square", side: 1 },
    ];
    for (const s of shapes) expect(typeof label(s)).toBe("string");
  });
});
