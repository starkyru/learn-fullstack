import { depsChanged, getCurrentFiber } from "./01-use-state.js";
import type { HookCell } from "./01-use-state.js";

/**
 * `useMemo` and `useRef` on the same mini renderer — two more shapes of "remember something across
 * renders in a hook cell".
 *
 * YOUR TURN — implement `useMemo` and `useRef`:
 *   - useMemo(factory, deps): read the cell at hooks[cursor]; if it is missing OR
 *     `depsChanged(cell.deps, deps)`, recompute `factory()` and store { memoizedState, deps };
 *     otherwise reuse the cached value (SAME reference). Advance the cursor; return the value.
 *   - useRef(initial): on mount create one `{ current: initial }` box in the cell; on every later
 *     render return that SAME box (ignore `initial`). Never call the scheduler — mutating current must
 *     not re-render. Advance the cursor; return the box.
 */

export function useMemo<T>(_factory: () => T, _deps: readonly unknown[]): T {
  const _cell: HookCell | undefined = undefined; // hint: cache value + deps in a HookCell
  void _cell;
  void depsChanged;
  void getCurrentFiber;
  throw new Error(
    "TODO: recompute only when deps change; otherwise return the cached value",
  );
}

export function useRef<T>(_initial: T): { current: T } {
  throw new Error(
    "TODO: create the { current } box once and return the same box every render",
  );
}
