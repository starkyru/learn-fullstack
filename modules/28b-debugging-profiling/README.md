# Module 28b — Debugging & Profiling 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The tooling in this space is irreducibly manual — React DevTools' Profiler, `node --inspect`
breakpoints, `clinic`/`0x` flame graphs, `EXPLAIN ANALYZE`, and Chrome heap snapshots. You can't
put a real inspector or browser in a unit-test gate. So this module does the honest thing: it
**extracts the testable LOGIC** behind each workflow and unit-tests that, while the manual steps
ship as **documented artifacts** (below) the gate does not run. You learn the tool by using it on a
real app; you prove you understand the underlying bug/algorithm here.

## Concepts

- **A "wasted render" is a memo bail-out that never happens.** `React.memo` compares props with
  `Object.is`; hand it a fresh object/callback literal every render and the comparison is always
  `false`, so the child re-renders even though nothing it shows changed. The Profiler flame chart
  shows these as components that "rendered but didn't need to". The fix is always two halves:
  `memo` the child **and** stabilize every prop identity (`useMemo`/`useCallback`).
- **Bugs hide at the seams between layers.** An off-by-one in a service's page offset looks fine in
  isolation but shifts every HTTP response by a page. Attaching `--inspect` and stepping
  HTTP → service → repo lands you on the exact line; the fix is a one-character change that a test
  can pin forever.
- **A slowdown is usually an algorithm, not the language.** A hot O(n²) path and its O(n)
  replacement return identical answers — the difference is the number of operations. Inject an
  operation counter and the flame graph's story becomes an exact, deterministic assertion.
- **A leak is a reachable object.** A heap snapshot is a graph of nodes and references rooted at GC
  roots; an object leaks when a reference still reaches it from a root. Find the **retainer path**,
  cut the offending edge, and the object becomes collectable. A tiny injected-clock timing profiler
  (`mark`/`measure`) is the other half of the kit.

## Tasks

| #   | Task                     | Lane | Type | What you build                                                                          |
| --- | ------------------------ | ---- | ---- | --------------------------------------------------------------------------------------- |
| 1   | Debug a React render bug | 🟢   | WE   | solved DevTools-Profiler walkthrough + analog "find the wasted render" stub             |
| 2   | Debug a Node service     | 🟡   | TODO | attach --inspect, set a breakpoint across HTTP→service→DB, fix a bug                    |
| 3   | Profile a slowdown       | 🟡   | TODO | flame-graph a hot path (clinic/0x); EXPLAIN ANALYZE a slow query; fix both              |
| 4   | Hunt a memory leak       | 🔴   | FS   | reproduce a leak, take heap snapshots, find retainers; build a tiny perf_hooks profiler |

## Theory & docs

- **Debug a React render bug** —
  [React Developer Tools](https://react.dev/learn/react-developer-tools),
  [`memo`](https://react.dev/reference/react/memo),
  [`useCallback`](https://react.dev/reference/react/useCallback).
- **Debug a Node service** —
  [Node.js debugging guide](https://nodejs.org/en/learn/getting-started/debugging),
  [Chrome DevTools: debug JavaScript](https://developer.chrome.com/docs/devtools/javascript).
- **Profile a slowdown** —
  [Node.js flame graphs](https://nodejs.org/en/learn/diagnostics/flame-graphs),
  [Postgres `EXPLAIN`](https://www.postgresql.org/docs/current/using-explain.html).
- **Hunt a memory leak** —
  [record heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots),
  [Node `perf_hooks`](https://nodejs.org/api/perf_hooks.html) (the API the timing profiler
  mirrors).
- Background — [Chrome DevTools docs](https://developer.chrome.com/docs/devtools) for the
  Profiler/Sources/Memory panels the manual artifacts walk through.

## Done when

- [ ] The memoized child stops re-rendering: `FixedParent` keeps its child at **one** render across
      unrelated counter bumps while `BuggyParent`'s child re-renders each bump; `findWastedRender`
      returns the exact per-component wasted-render counts from a render log.
- [ ] The Node bug is pinned then fixed: `paginate` treats pages as 1-indexed (page 1 → offset 0),
      `listHandler` parses the query and delegates, and the tests assert the exact page windows,
      `totalPages`, and `hasNext`.
- [ ] The optimized path does far fewer ops: `firstDuplicateFast` returns the **same** value as
      `firstDuplicateNaive` for every input while the injected counter shows linear vs quadratic op
      counts (exact).
- [ ] The profiler measures durations off an injected clock, and the retainer analyzer returns the
      exact retaining path, frees the node when the leak edge is cut, and stays retained while a
      second path survives.

## Manual tooling (documented artifacts — the gate does NOT run these)

- **Task 1 — React DevTools Profiler.** Open DevTools → Profiler, tick "Record why each component
  rendered", interact, and look for children flagged as re-rendered with unchanged props. That is
  the `BuggyParent` shape; the fix is `FixedParent`.
- **Task 2 — `node --inspect`.** Run `node --inspect-brk dist/server.js`, open `chrome://inspect`,
  and set a breakpoint on the offset line in `paginate`. Step into the repo `fetch` and watch the
  offset — 1-indexed page 1 must resolve to offset 0, not `pageSize`.
- **Task 3 — flame graph + `EXPLAIN ANALYZE`.** Wrap the hot path with `clinic flame -- node app.js`
  (or `0x app.js`); the tall tower is the O(n²) inner loop. For the DB analog, run
  `EXPLAIN ANALYZE SELECT …` — a `Seq Scan` with a high row estimate is the "add an index" tell.
  The algorithmic fix is what's unit-tested here.
- **Task 4 — heap snapshots.** Take three snapshots (baseline → exercise the leak → settle) in
  Chrome/DevTools memory panel, diff them, and follow the "Retainers" pane to a GC root. That
  retainer chain is exactly what `retainerPath` computes.

> **Worked example (WE):** the render-bug components are fully solved in **both** `src/` and
> `solution/`; the analog `findWastedRender` throws `TODO` in `src/` — implement it. **TODO** tasks
> throw in `src/`; keep the signature and return shape, implement the body. **FS** (task 4) throws
> everything in `src/` — build it from scratch. Tests import from `solution/`; point them at
> `../src/...` to grade your own build.
