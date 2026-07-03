import { useEffect, useState } from "react";

/**
 * FIXED — a self-incrementing counter. The bug this fixes: an effect that runs once
 * (`[]` deps) captures `count` in its closure, so `setCount(count + 1)` always reads
 * the stale initial `0` and the display sticks at `1`. The fix is the FUNCTIONAL
 * updater `setCount(c => c + 1)`, which reads the latest state without depending on
 * `count` — so the effect can safely run once and still count correctly.
 */
export function AutoCounter({ intervalMs = 1000 }: { intervalMs?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return <output>{count}</output>;
}
