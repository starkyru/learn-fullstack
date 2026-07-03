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
 * `MemoChild` calls the injected `onRender` on every real render, so a test can count renders
 * exactly. `BuggyParent` passes a fresh `config` object each render (memo defeated); `FixedParent`
 * memoizes it (memo bails out on the unrelated counter change).
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

export interface ActionChildProps {
  /** A callback prop — its identity must stay stable for `memo` to bail out. */
  onAction: () => void;
  onRender: () => void;
}

/**
 * A second memoized child that receives ONLY a callback (never the changing counter). If the
 * callback keeps a stable identity across bumps, `memo` bails and this child renders once; if a
 * fresh arrow is passed each render, its props change identity and it re-renders every bump.
 */
function ActionChildImpl({ onAction, onRender }: ActionChildProps) {
  onRender();
  return <button data-testid="action" onClick={onAction} />;
}

export const ActionChild = memo(ActionChildImpl);

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
export function FixedParent({
  onChildRender,
  onActionRender = () => {},
}: {
  onChildRender: () => void;
  onActionRender?: () => void;
}) {
  const [count, setCount] = useState(0);
  const config = useMemo(() => ({ theme: "light" }), []);
  const bump = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <button data-testid="bump" onClick={bump}>
        {count}
      </button>
      <MemoChild config={config} onRender={onChildRender} />
      <ActionChild onAction={bump} onRender={onActionRender} />
    </div>
  );
}

// --- Analog exercise: "find the wasted render" from a render log -----------------------------

export interface RenderRecord {
  component: string;
  props: Record<string, unknown>;
}

function shallowEqualProps(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Given a chronological render log, find the WASTED renders: a render is wasted when a component
 * re-rendered with props shallow-equal to its own immediately-previous render (nothing it displays
 * actually changed). Returns a map of component name → count of wasted renders (components with
 * zero wasted renders are omitted).
 */
export function findWastedRender(records: RenderRecord[]): Record<string, number> {
  const previous = new Map<string, Record<string, unknown>>();
  const wasted: Record<string, number> = {};
  for (const record of records) {
    const prev = previous.get(record.component);
    if (prev !== undefined && shallowEqualProps(prev, record.props)) {
      wasted[record.component] = (wasted[record.component] ?? 0) + 1;
    }
    previous.set(record.component, record.props);
  }
  return wasted;
}
