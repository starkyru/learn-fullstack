import { depsChanged, getCurrentFiber } from "./01-use-state.js";
import type { HookCell } from "./01-use-state.js";

/**
 * `useMemo` and `useRef` on the same mini renderer — two more shapes of "remember something in a hook
 * cell across renders".
 *
 *   - `useMemo(factory, deps)` is a MEMO CELL: recompute `factory()` only when `deps` change, else
 *     return the previously cached value (same reference — that reference stability is the point).
 *   - `useRef(initial)` is a PERSISTENT CELL: create one `{ current }` box on mount and hand back that
 *     SAME box every render. Mutating `ref.current` never re-renders (we never touch the scheduler),
 *     and the value survives across renders because it lives in the cell.
 */

export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T {
  const fiber = getCurrentFiber();
  const index = fiber.cursor;
  const existing = fiber.hooks[index];

  let cell: HookCell;
  if (existing === undefined || depsChanged(existing.deps, deps)) {
    cell = { memoizedState: factory(), deps };
    fiber.hooks[index] = cell;
  } else {
    cell = existing; // deps unchanged → reuse the cached value + reference
  }

  fiber.cursor++;
  return cell.memoizedState as T;
}

export function useRef<T>(initial: T): { current: T } {
  const fiber = getCurrentFiber();
  const index = fiber.cursor;
  const existing = fiber.hooks[index];
  // Create the box once; ignore `initial` on every later render (the cell already holds the box).
  const cell: HookCell = existing ?? { memoizedState: { current: initial } };
  if (existing === undefined) fiber.hooks[index] = cell;

  fiber.cursor++;
  return cell.memoizedState as { current: T };
}
