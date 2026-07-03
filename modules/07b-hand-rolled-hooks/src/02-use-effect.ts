import { depsChanged, getCurrentFiber } from "./01-use-state.js";
import type { HookCell } from "./01-use-state.js";

/**
 * `useEffect` on the same mini renderer. An effect runs AFTER the render pass, only when its deps
 * changed. The cell remembers the last `deps` and the last `cleanup`.
 *
 * YOUR TURN — implement `useEffect`:
 *   1. read/create the cell at hooks[cursor] (fiber from getCurrentFiber()).
 *   2. compute `depsChanged(cell.deps, deps)` — if changed (or no deps array), PUSH a job onto
 *      `fiber.pendingEffects`: run the previous `cell.cleanup` first, then call `effect()`, then store
 *      its return value as the new `cell.cleanup` (undefined if it returned nothing).
 *   3. store `cell.deps = deps` and advance the cursor.
 * (The renderer flushes `pendingEffects` after the component returns; `unmount` runs each `cleanup`.)
 */

export type EffectCallback = () => void | (() => void);

export function useEffect(_effect: EffectCallback, _deps?: readonly unknown[]): void {
  const _cell: HookCell | undefined = undefined; // hint: your effect state lives in a HookCell
  void _cell;
  void depsChanged;
  void getCurrentFiber;
  throw new Error(
    "TODO: schedule the effect when deps change; store cleanup for re-run and unmount",
  );
}
