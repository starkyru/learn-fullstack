import { describe, expect, it } from "vitest";
import { LOG_LEVELS, indexOfLevel, rankOf } from "../solution/05-as-const.js";

describe("indexOfLevel", () => {
  it("finds a level's position in the frozen tuple", () => {
    expect(indexOfLevel("debug")).toBe(0);
    expect(indexOfLevel("warn")).toBe(2);
  });
  it("LOG_LEVELS keeps its declared order", () => {
    expect([...LOG_LEVELS]).toEqual(["debug", "info", "warn", "error"]);
  });
});

describe("rankOf", () => {
  it("returns a 1-based rank over PRIORITIES", () => {
    expect(rankOf("low")).toBe(1);
    expect(rankOf("medium")).toBe(2);
    expect(rankOf("high")).toBe(3);
  });
});
