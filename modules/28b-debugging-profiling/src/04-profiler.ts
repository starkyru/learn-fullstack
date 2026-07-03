/**
 * Hunt a memory leak — build the two tools you reach for by hand.
 *
 * 1. A tiny `perf_hooks`-style timing profiler: `mark(name)` stamps the current time, `measure`
 *    records a named duration between two marks. The clock is INJECTED (`() => number`) — never
 *    `perf_hooks`/`Date.now` — so durations are exact and deterministic in tests.
 *
 * 2. A retainer-graph analyzer: heap snapshots are a graph of objects (nodes) and references
 *    (edges) rooted at GC roots. An object leaks when a reference still reaches it from a root, so
 *    the collector can't free it. `retainerPath` finds the chain root → … → target that keeps it
 *    alive; `cutEdge` removes the leaking reference; after cutting the last retainer the target is
 *    no longer reachable — collectable.
 *
 * FROM SCRATCH: every function throws. Implement them; the tests import from `solution/`.
 */

export type Clock = () => number;

export interface Profiler {
  mark(name: string): void;
  measure(name: string, from: string, to: string): number;
  marks(): Record<string, number>;
  durations(): Record<string, number>;
}

/**
 * YOUR TURN — build the profiler over the injected `clock`.
 *   - mark(name): store `clock()` under `name`.
 *   - measure(name, from, to): duration = time[to] - time[from]; store it under `name`; return it;
 *     throw if either mark is missing.
 *   - marks()/durations(): return plain-object copies of the recorded marks / measured durations.
 */
export function createProfiler(_clock: Clock): Profiler {
  throw new Error("TODO: implement mark/measure/marks/durations over the injected clock");
}

export interface Graph {
  nodes: string[];
  /** Directed references: `[from, to]` means `from` holds a reference to `to`. */
  edges: Array<[string, string]>;
}

/**
 * YOUR TURN — BFS from the roots (in order, following each node's out-edges in insertion order) to
 * `target`. Return the discovered path `[root, …, target]`, or `null` if `target` is unreachable
 * (already collectable).
 */
export function retainerPath(
  _graph: Graph,
  _roots: readonly string[],
  _target: string,
): string[] | null {
  throw new Error("TODO: BFS from roots to target; return the retaining path or null");
}

/** YOUR TURN — reachable from any root? (i.e. `retainerPath(...) !== null`). */
export function isReachable(
  _graph: Graph,
  _roots: readonly string[],
  _target: string,
): boolean {
  throw new Error("TODO: return whether target is reachable from a root");
}

/** YOUR TURN — return a NEW graph with the directed edge `from → to` removed (nodes unchanged). */
export function cutEdge(_graph: Graph, _from: string, _to: string): Graph {
  throw new Error("TODO: return a copy of the graph without the from→to edge");
}
