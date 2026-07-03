/**
 * Debugging a React render bug — the classic "wasted render".
 *
 * A parent owns state that changes (a counter). A child below it renders something UNRELATED to
 * that counter. Naively, every parent re-render re-renders the child too. `React.memo` should stop
 * that — but only if the child's props keep a STABLE identity. Pass a fresh object/callback literal
 * each render and `memo` can never bail out (every render `Object.is(prevProps, nextProps)` is
 * false), so the child re-renders anyway. That is the wasted render.
 *
 * The FIX has two halves and you need BOTH:
 *   1. wrap the child in `React.memo`, and
 *   2. stabilize every prop identity with `useMemo` / `useCallback`.
 *
 * This worked example is SOLVED — read it, run the test, open React DevTools' Profiler on a real
 * app and watch which components "rendered but didn't need to". Then implement the analog
 * `findWastedRender` below.
 */

import { memo, useCallback, useMemo, useState } from "react";

export interface ChildProps {
  config: { theme: string };
  onRender: () => void;
}

function ChildImpl({ config, onRender }: ChildProps) {
  // Called once per real render — the render-counter seam the test asserts against.
  onRender();
  return <span data-testid="child">{config.theme}</span>;
}

/** Memoized child: re-renders only when its props change by identity (shallow). */
export const MemoChild = memo(ChildImpl);

/**
 * BUG: a fresh `{ theme: "light" }` object is created on every render, so `MemoChild`'s props
 * change identity every time the counter bumps → memo can't bail → the child re-renders (wasted).
 */
export function BuggyParent({ onChildRender }: { onChildRender: () => void }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button data-testid="bump" onClick={() => setCount((c) => c + 1)}>
        {count}
      </button>
      <MemoChild config={{ theme: "light" }} onRender={onChildRender} />
    </div>
  );
}

/**
 * FIX: `config` (and `onChildRender`, provided stable by the caller) keep a stable identity via
 * `useMemo`, so bumping the unrelated counter leaves `MemoChild`'s props untouched → memo bails →
 * the child does NOT re-render.
 */
export function FixedParent({ onChildRender }: { onChildRender: () => void }) {
  const [count, setCount] = useState(0);
  const config = useMemo(() => ({ theme: "light" }), []);
  const bump = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <button data-testid="bump" onClick={bump}>
        {count}
      </button>
      <MemoChild config={config} onRender={onChildRender} />
    </div>
  );
}

// --- Analog exercise: "find the wasted render" from a render log -----------------------------

export interface RenderRecord {
  component: string;
  props: Record<string, unknown>;
}

/**
 * YOUR TURN — implement `findWastedRender`.
 *
 * Given a chronological render log, find the WASTED renders: a render is wasted when a component
 * re-rendered with props shallow-equal to its own immediately-previous render (nothing it displays
 * actually changed). Return a map of component name → count of wasted renders (omit components with
 * zero wasted renders). Compare props one level deep with `Object.is` — a differing key count means
 * "changed".
 */
export function findWastedRender(_records: RenderRecord[]): Record<string, number> {
  throw new Error(
    "TODO: scan the log; count renders whose props are shallow-equal to the previous",
  );
}
