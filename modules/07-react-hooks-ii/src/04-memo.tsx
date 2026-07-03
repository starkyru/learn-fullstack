import { useState } from "react";

/**
 * YOUR TURN (extend/refactor) — this WORKS but wastes renders: bumping `count` re-renders
 * `Child` even though nothing it depends on changed. Fix it so `Child` only renders when its
 * own props change:
 *   1. wrap `Child` in `React.memo`.
 *   2. make `onPing` a STABLE identity with `useCallback([])`.
 * `onRender` is called once per Child render — the test asserts it stays at 1 after a bump.
 */
export function Child({
  onPing,
  onRender,
}: {
  onPing: () => void;
  onRender: () => void;
}) {
  onRender();
  return (
    <button type="button" onClick={onPing}>
      ping
    </button>
  );
}

export function Parent({ onChildRender }: { onChildRender: () => void }) {
  const [count, setCount] = useState(0);
  const [pings, setPings] = useState(0);
  const onPing = () => setPings((p) => p + 1);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="pings">{pings}</span>
      <button type="button" aria-label="bump" onClick={() => setCount((c) => c + 1)}>
        bump
      </button>
      <Child onPing={onPing} onRender={onChildRender} />
    </div>
  );
}
