import { describe, expect, it } from "vitest";
import { nextRovingIndex } from "../solution/04-keyboard.js";

describe("nextRovingIndex", () => {
  it("moves forward and wraps past the last item", () => {
    expect(nextRovingIndex(0, "ArrowDown", 3)).toBe(1);
    expect(nextRovingIndex(2, "ArrowRight", 3)).toBe(0);
  });
  it("moves backward and wraps before the first item", () => {
    expect(nextRovingIndex(0, "ArrowUp", 3)).toBe(2);
    expect(nextRovingIndex(1, "ArrowLeft", 3)).toBe(0);
  });
  it("jumps to first/last on Home/End", () => {
    expect(nextRovingIndex(2, "Home", 3)).toBe(0);
    expect(nextRovingIndex(0, "End", 3)).toBe(2);
  });
  it("ignores unrelated keys", () => {
    expect(nextRovingIndex(1, "a", 3)).toBe(1);
  });
});
