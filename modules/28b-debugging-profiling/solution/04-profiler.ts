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
 */

export type Clock = () => number;

export interface Profiler {
  mark(name: string): void;
  measure(name: string, from: string, to: string): number;
  marks(): Record<string, number>;
  durations(): Record<string, number>;
}

export function createProfiler(clock: Clock): Profiler {
  const marks = new Map<string, number>();
  const durations = new Map<string, number>();
  return {
    mark(name) {
      marks.set(name, clock());
    },
    measure(name, from, to) {
      const start = marks.get(from);
      const end = marks.get(to);
      if (start === undefined) throw new Error(`no mark named "${from}"`);
      if (end === undefined) throw new Error(`no mark named "${to}"`);
      const duration = end - start;
      durations.set(name, duration);
      return duration;
    },
    marks() {
      return Object.fromEntries(marks);
    },
    durations() {
      return Object.fromEntries(durations);
    },
  };
}

export interface Graph {
  nodes: string[];
  /** Directed references: `[from, to]` means `from` holds a reference to `to`. */
  edges: Array<[string, string]>;
}

function buildAdjacency(graph: Graph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) adjacency.set(node, []);
  for (const [from, to] of graph.edges) {
    const list = adjacency.get(from);
    if (list) list.push(to);
    else adjacency.set(from, [to]);
  }
  return adjacency;
}

function reconstruct(parent: Map<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let cursor: string | null | undefined = target;
  while (cursor != null) {
    path.unshift(cursor);
    cursor = parent.get(cursor) ?? null;
  }
  return path;
}

/**
 * BFS from the roots (in order, following each node's out-edges in insertion order) to `target`.
 * Returns the shortest discovered path `[root, …, target]`, or `null` if unreachable.
 */
export function retainerPath(
  graph: Graph,
  roots: readonly string[],
  target: string,
): string[] | null {
  const adjacency = buildAdjacency(graph);
  const parent = new Map<string, string | null>();
  const queue: string[] = [];
  for (const root of roots) {
    if (!parent.has(root)) {
      parent.set(root, null);
      queue.push(root);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]!;
    if (current === target) return reconstruct(parent, target);
    for (const next of adjacency.get(current) ?? []) {
      if (!parent.has(next)) {
        parent.set(next, current);
        queue.push(next);
      }
    }
  }
  return null;
}

/** Reachable from any root? */
export function isReachable(
  graph: Graph,
  roots: readonly string[],
  target: string,
): boolean {
  return retainerPath(graph, roots, target) !== null;
}

/** Return a NEW graph with the directed edge `from → to` removed (nodes unchanged). */
export function cutEdge(graph: Graph, from: string, to: string): Graph {
  return {
    nodes: [...graph.nodes],
    edges: graph.edges.filter(([f, t]) => !(f === from && t === to)),
  };
}
