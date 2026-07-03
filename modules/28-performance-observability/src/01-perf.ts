/**
 * Task 1 — Frontend perf (WORKED EXAMPLE).
 *
 * A code-splitting *model*: routes carry an estimated `sizeKb` and a `lazy` flag. The initial
 * chunk is just the sum of the eager routes, so "make it faster" == "move routes out of the
 * initial set". `splitByRoute` (the solved fix) and `splitByBudget` (the analog you build) both
 * shrink that set. `scoreWebVitals` applies the exact good/needs-improvement/poor thresholds the
 * browser's `web-vitals` library uses — pure arithmetic, no browser needed.
 */

export type Rating = "good" | "needs-improvement" | "poor";

/** A route + its estimated code size, and whether it code-splits into a lazy chunk. */
export interface Route {
  path: string;
  sizeKb: number;
  lazy: boolean;
}

/** What the bundler would ship: the initial chunk vs the on-demand lazy chunks. */
export interface BundleEstimate {
  initialKb: number;
  lazyKb: number;
  initialRoutes: string[];
  lazyRoutes: string[];
}

/** SOLVED — split routes by eager/lazy and total each side. The initial chunk is the eager sum. */
export function estimateBundle(routes: readonly Route[]): BundleEstimate {
  const eager = routes.filter((r) => !r.lazy);
  const lazy = routes.filter((r) => r.lazy);
  const sum = (rs: readonly Route[]): number => rs.reduce((n, r) => n + r.sizeKb, 0);
  return {
    initialKb: sum(eager),
    lazyKb: sum(lazy),
    initialRoutes: eager.map((r) => r.path),
    lazyRoutes: lazy.map((r) => r.path),
  };
}

/**
 * SOLVED split fix — keep only the `eagerPaths` in the initial chunk; lazy-load everything else.
 * This is the "move routes out of the initial set" lever: fewer eager routes → smaller `initialKb`.
 */
export function splitByRoute(
  routes: readonly Route[],
  eagerPaths: readonly string[],
): Route[] {
  const eager = new Set(eagerPaths);
  return routes.map((r) => ({ ...r, lazy: !eager.has(r.path) }));
}

/**
 * YOUR TURN (analog) — mirror `splitByRoute`, but split by a size budget instead of a path list:
 *   1. Walk `routes` in order, tracking cumulative eager size (`used`).
 *   2. Keep a route eager (`lazy: false`) while `used + r.sizeKb <= budgetKb`, adding to `used`.
 *   3. Once the budget is spent, mark the rest lazy (`lazy: true`).
 *   4. Return a NEW array (`routes.map(...)`); don't mutate the inputs.
 */
export function splitByBudget(_routes: readonly Route[], _budgetKb: number): Route[] {
  throw new Error(
    "TODO: keep routes eager while cumulative size ≤ budgetKb, lazy the rest (mirror splitByRoute)",
  );
}

/** Ratings ordered by badness — used to pick the worst metric as the overall score. */
const RATING_RANK: Record<Rating, number> = { good: 0, "needs-improvement": 1, poor: 2 };

/** `≤ goodMax` → good, `≤ needsMax` → needs-improvement, else poor. Boundaries are inclusive. */
function scoreMetric(value: number, goodMax: number, needsMax: number): Rating {
  if (value <= goodMax) return "good";
  if (value <= needsMax) return "needs-improvement";
  return "poor";
}

/** The three Core Web Vitals: LCP (ms), CLS (unitless layout shift), INP (ms). */
export interface WebVitals {
  lcp: number;
  cls: number;
  inp: number;
}

export interface WebVitalsScore {
  lcp: Rating;
  cls: Rating;
  inp: Rating;
  overall: Rating;
}

/**
 * SOLVED — score each metric against its official thresholds and take the worst as `overall`:
 *   LCP  good ≤ 2500ms, needs ≤ 4000ms, else poor
 *   CLS  good ≤ 0.1,    needs ≤ 0.25,   else poor
 *   INP  good ≤ 200ms,  needs ≤ 500ms,  else poor
 */
export function scoreWebVitals(v: WebVitals): WebVitalsScore {
  const lcp = scoreMetric(v.lcp, 2500, 4000);
  const cls = scoreMetric(v.cls, 0.1, 0.25);
  const inp = scoreMetric(v.inp, 200, 500);
  const overall = [lcp, cls, inp].reduce<Rating>(
    (worst, r) => (RATING_RANK[r] > RATING_RANK[worst] ? r : worst),
    "good",
  );
  return { lcp, cls, inp, overall };
}
