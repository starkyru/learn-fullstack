import { useEffect, useState } from "react";

/**
 * YOUR TURN (extend/fix) — this counter is BUGGY. The effect runs once (`[]` deps)
 * and its closure captures `count` at its initial value `0`, so `setCount(count + 1)`
 * keeps writing `1` forever — the display freezes at 1 after the first tick.
 *
 * Fix it WITHOUT adding `count` to the dep array (that would tear down/recreate the
 * interval every tick). Use the functional updater form: `setCount(c => c + 1)`,
 * which always reads the latest state. Keep the cleanup (`clearInterval`).
 */
export function AutoCounter({ intervalMs = 1000 }: { intervalMs?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // BUG: `count` is stale (captured once); this always computes 0 + 1 = 1.
    const id = setInterval(() => setCount(count + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return <output>{count}</output>;
}
