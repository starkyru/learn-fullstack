import { describe, expect, it } from "vitest";
import {
  estimateBundle,
  scoreWebVitals,
  splitByBudget,
  splitByRoute,
  type Route,
} from "../solution/01-perf.js";

// An app where EVERY route is eager — the "before" state a split fixes.
const allEager: Route[] = [
  { path: "/", sizeKb: 40, lazy: false },
  { path: "/dashboard", sizeKb: 120, lazy: false },
  { path: "/reports", sizeKb: 200, lazy: false },
  { path: "/settings", sizeKb: 60, lazy: false },
];

describe("estimateBundle", () => {
  it("sums eager routes into initialKb and lazy routes into lazyKb", () => {
    const est = estimateBundle([
      { path: "/", sizeKb: 40, lazy: false },
      { path: "/reports", sizeKb: 200, lazy: true },
    ]);
    expect(est).toEqual({
      initialKb: 40,
      lazyKb: 200,
      initialRoutes: ["/"],
      lazyRoutes: ["/reports"],
    });
  });
});

describe("splitByRoute (solved fix)", () => {
  it("shrinks the initial chunk to only the eager paths", () => {
    const before = estimateBundle(allEager);
    const split = splitByRoute(allEager, ["/"]);
    const after = estimateBundle(split);

    // The fix moves 3 routes out of the initial set.
    expect(before.initialKb).toBe(420);
    expect(after.initialKb).toBe(40);
    expect(after.initialRoutes).toEqual(["/"]);
    expect(after.lazyRoutes).toEqual(["/dashboard", "/reports", "/settings"]);
    expect(after.initialRoutes.length).toBeLessThan(before.initialRoutes.length);
  });
});

describe("splitByBudget (analog)", () => {
  it("keeps routes eager only while cumulative size stays within budget", () => {
    // Budget 100: "/" (40) fits → used 40; "/dashboard" (120) would be 160 > 100 → lazy;
    // "/reports" (200) → lazy; "/settings" (60) fits (40+60=100) → eager.
    const split = splitByBudget(allEager, 100);
    const after = estimateBundle(split);
    expect(after.initialRoutes).toEqual(["/", "/settings"]);
    expect(after.initialKb).toBe(100);
    expect(after.lazyRoutes).toEqual(["/dashboard", "/reports"]);
  });
});

describe("scoreWebVitals", () => {
  it("rates each metric good at its exact inclusive good boundary", () => {
    expect(scoreWebVitals({ lcp: 2500, cls: 0.1, inp: 200 })).toEqual({
      lcp: "good",
      cls: "good",
      inp: "good",
      overall: "good",
    });
  });

  it("crosses into needs-improvement one unit past the good boundary", () => {
    expect(scoreWebVitals({ lcp: 2501, cls: 0.11, inp: 201 })).toEqual({
      lcp: "needs-improvement",
      cls: "needs-improvement",
      inp: "needs-improvement",
      overall: "needs-improvement",
    });
  });

  it("crosses into poor one unit past the needs boundary and overall is the worst metric", () => {
    // LCP 4000 = needs (inclusive), CLS 0.26 = poor, INP 200 = good → overall poor.
    expect(scoreWebVitals({ lcp: 4000, cls: 0.26, inp: 200 })).toEqual({
      lcp: "needs-improvement",
      cls: "poor",
      inp: "good",
      overall: "poor",
    });
  });

  it("rates INP at its inclusive needs boundary (500) as needs-improvement", () => {
    // INP 500 = needs (inclusive upper bound); LCP/CLS good → overall needs-improvement.
    expect(scoreWebVitals({ lcp: 2500, cls: 0.1, inp: 500 })).toEqual({
      lcp: "good",
      cls: "good",
      inp: "needs-improvement",
      overall: "needs-improvement",
    });
  });

  it("rates INP and LCP poor once past their needs boundary", () => {
    // INP 501 > 500 → poor (dies to scoreMetric(v.inp, 200, 500) -> (200, 9999), which would
    // rate 501 as needs-improvement); LCP 4001 > 4000 → poor.
    expect(scoreWebVitals({ lcp: 4001, cls: 0.1, inp: 501 })).toEqual({
      lcp: "poor",
      cls: "good",
      inp: "poor",
      overall: "poor",
    });
  });
});
