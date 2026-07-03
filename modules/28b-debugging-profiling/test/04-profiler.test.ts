import { describe, expect, it } from "vitest";
import {
  createProfiler,
  cutEdge,
  type Graph,
  isReachable,
  retainerPath,
} from "../solution/04-profiler.js";

describe("createProfiler — durations from an injected clock", () => {
  it("measures the difference between two marks", () => {
    let now = 0;
    const profiler = createProfiler(() => now);
    now = 5;
    profiler.mark("start");
    now = 20;
    profiler.mark("end");
    expect(profiler.measure("work", "start", "end")).toBe(15);
    expect(profiler.durations()).toEqual({ work: 15 });
    expect(profiler.marks()).toEqual({ start: 5, end: 20 });
  });

  it("records multiple named durations off a scripted clock", () => {
    const ticks = [0, 3, 3, 10]; // load@0, parse@3, render@3, done@10
    let i = 0;
    const profiler = createProfiler(() => ticks[i++]!);
    profiler.mark("load");
    profiler.mark("parse");
    profiler.mark("render");
    profiler.mark("done");
    profiler.measure("parsing", "load", "parse");
    profiler.measure("rendering", "render", "done");
    expect(profiler.durations()).toEqual({ parsing: 3, rendering: 7 });
  });

  it("throws when a referenced mark was never set", () => {
    const profiler = createProfiler(() => 0);
    profiler.mark("only");
    expect(() => profiler.measure("bad", "only", "missing")).toThrow(/missing/);
  });

  it("throws when the 'from' mark was never set (guards the start lookup)", () => {
    const profiler = createProfiler(() => 0);
    profiler.mark("only");
    // 'from' is the missing one here — must throw naming it, not silently return NaN.
    expect(() => profiler.measure("bad", "missing-start", "only")).toThrow(
      'no mark named "missing-start"',
    );
    // and it must not have recorded a bogus duration.
    expect(profiler.durations()).toEqual({});
  });
});

describe("retainer-graph analyzer — find and free a leak", () => {
  // roots ─▶ cache ─▶ entry ─▶ leaked   (single retaining chain)
  const chain: Graph = {
    nodes: ["root", "cache", "entry", "leaked", "orphan"],
    edges: [
      ["root", "cache"],
      ["cache", "entry"],
      ["entry", "leaked"],
    ],
  };

  it("finds the retaining path from a root to the leaked node", () => {
    expect(retainerPath(chain, ["root"], "leaked")).toEqual([
      "root",
      "cache",
      "entry",
      "leaked",
    ]);
  });

  it("a node with no incoming reference is already unreachable (collectable)", () => {
    expect(retainerPath(chain, ["root"], "orphan")).toBeNull();
    expect(isReachable(chain, ["root"], "orphan")).toBe(false);
  });

  it("cutting the retaining edge frees the leaked node", () => {
    expect(isReachable(chain, ["root"], "leaked")).toBe(true);
    const fixed = cutEdge(chain, "entry", "leaked");
    expect(isReachable(fixed, ["root"], "leaked")).toBe(false);
    expect(retainerPath(fixed, ["root"], "leaked")).toBeNull();
    // cutEdge is pure — the original graph still retains the node.
    expect(isReachable(chain, ["root"], "leaked")).toBe(true);
  });

  it("with two retainers, cutting one is not enough — BFS finds the shortest remaining path", () => {
    // root ─▶ a ─▶ leaked  and  root ─▶ b ─▶ leaked
    const twoPaths: Graph = {
      nodes: ["root", "a", "b", "leaked"],
      edges: [
        ["root", "a"],
        ["root", "b"],
        ["a", "leaked"],
        ["b", "leaked"],
      ],
    };
    expect(retainerPath(twoPaths, ["root"], "leaked")).toEqual(["root", "a", "leaked"]);
    const cutA = cutEdge(twoPaths, "a", "leaked");
    expect(isReachable(cutA, ["root"], "leaked")).toBe(true); // still held via b
    expect(retainerPath(cutA, ["root"], "leaked")).toEqual(["root", "b", "leaked"]);
    const cutBoth = cutEdge(cutA, "b", "leaked");
    expect(isReachable(cutBoth, ["root"], "leaked")).toBe(false);
  });

  it("returns the SHORTEST retaining path when a short and a longer path both reach the leak", () => {
    // A long detour (root → a → b → leaked, length 4) is inserted BEFORE the direct edge
    // (root → leaked, length 2). BFS must return the direct 2-node path; a depth-first walk that
    // follows insertion order would dive down the detour and report the longer chain.
    const graph: Graph = {
      nodes: ["root", "a", "b", "leaked"],
      edges: [
        ["root", "a"],
        ["a", "b"],
        ["b", "leaked"],
        ["root", "leaked"],
      ],
    };
    expect(retainerPath(graph, ["root"], "leaked")).toEqual(["root", "leaked"]);
  });
});
