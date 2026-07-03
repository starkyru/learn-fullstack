import { depsChanged, getCurrentFiber } from "./01-use-state.js";
import type { HookCell } from "./01-use-state.js";

/**
 * `useEffect` on the same mini renderer. An effect is a side-effect that runs AFTER the render pass,
 * only when its dependencies changed since last time. The cell remembers the last `deps` and the last
 * `cleanup`. On each render we:
 *
 *   1. read/create the cell at `hooks[cursor]`,
 *   2. compare the new deps to the cell's stored deps (`depsChanged`),
 *   3. if changed (or no deps array), PUSH a job onto the fiber's `pendingEffects`; the renderer runs
 *      those jobs after the component returns. The job first runs the previous cleanup, then the
 *      effect, then stores the returned cleanup for next time / for unmount.
 *
 * `unmount` (in `01`) walks the hook cells and calls each stored `cleanup` — that is how an effect's
 * teardown runs when the component goes away.
 */

export type EffectCallback = () => void | (() => void);

export function useEffect(effect: EffectCallback, deps?: readonly unknown[]): void {
  const fiber = getCurrentFiber();
  const index = fiber.cursor;
  const existing = fiber.hooks[index];
  const cell: HookCell = existing ?? { memoizedState: undefined };
  if (existing === undefined) fiber.hooks[index] = cell;

  const shouldRun = depsChanged(cell.deps, deps);
  if (shouldRun) {
    fiber.pendingEffects.push(() => {
      if (typeof cell.cleanup === "function") cell.cleanup(); // tear down the previous effect first
      const result = effect();
      cell.cleanup = typeof result === "function" ? result : undefined;
    });
  }

  cell.deps = deps; // remember this render's deps for next time
  fiber.cursor++;
}
