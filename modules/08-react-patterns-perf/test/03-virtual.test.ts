import { describe, expect, it } from "vitest";
import { visibleRange } from "../solution/03-virtual.js";

// 1000 rows, 20px each, 100px viewport → 5 rows visible + overscan.
describe("visibleRange", () => {
  it("windows the top of the list", () => {
    expect(visibleRange(0, 100, 20, 1000)).toEqual({ start: 0, end: 6 });
  });
  it("windows a scrolled offset with overscan on both sides", () => {
    // scrollTop 200 → first visible row 10; overscan 1 → start 9; end ceil(300/20)+1 = 16
    expect(visibleRange(200, 100, 20, 1000)).toEqual({ start: 9, end: 16 });
  });
  it("clamps to the list bounds at the end", () => {
    expect(visibleRange(19900, 100, 20, 1000)).toEqual({ start: 994, end: 1000 });
  });
});
