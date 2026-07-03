/**
 * A tiny React-like renderer, from scratch — NOT real React. A component is just a function; its
 * "memory" lives in an array of hook cells on a per-component fiber. Each render resets a cursor to 0
 * and every hook reads/creates `hooks[cursor++]`, so hooks bind to their cell by CALL ORDER — that is
 * the whole reason for the rules of hooks.
 *
 * The dispatcher plumbing (`currentFiber`, `getCurrentFiber`, `depsChanged`) is GIVEN below so the
 * sibling hooks can reach the current cell array. Your job is the two functions that THROW.
 *
 * YOUR TURN — implement `createRoot` and `useState`:
 *   1. createRoot: build a fiber ({ component, props, result, hooks: [], cursor: 0, pendingEffects: [],
 *      isMounted: false, rerender }); wire `rerender` to re-invoke the component (reset cursor to 0,
 *      reset pendingEffects, run component, store result, then flush pendingEffects); do an initial
 *      render; return { render(nextProps?), getResult(), unmount() } where unmount runs each cell's
 *      cleanup.
 *   2. useState(initial): read/create hooks[cursor]; on mount compute the initial (call it if it's a
 *      function) and build a STABLE `setState` that writes the cell and calls fiber.rerender() —
 *      unless the next value is Object.is-equal (bail, no re-render). Advance the cursor; return
 *      [value, setState].
 */

export type Component<P, R> = (props: P) => R;

export interface HookCell {
  memoizedState: unknown;
  deps?: readonly unknown[] | undefined;
  cleanup?: (() => void) | undefined;
  dispatch?: unknown;
}

export interface HookState {
  hooks: HookCell[];
  cursor: number;
  pendingEffects: Array<() => void>;
  rerender: () => void;
}

export interface Fiber<P, R> extends HookState {
  component: Component<P, R>;
  props: P;
  result: R;
  isMounted: boolean;
}

export interface Root<P, R> {
  render: (nextProps?: P) => R;
  getResult: () => R;
  unmount: () => void;
}

// The "dispatcher": the fiber currently rendering. Hooks read it via getCurrentFiber().
const currentFiber: HookState | null = null;

/** Reach the fiber that is rendering right now. Throws if called outside a render (rules of hooks). */
export function getCurrentFiber(): HookState {
  if (currentFiber === null) {
    throw new Error(
      "Hook called outside of a render — no current fiber. Call hooks inside a component rendered by createRoot.",
    );
  }
  return currentFiber;
}

/**
 * Compare two dependency arrays the way React does. `undefined` next-deps means "no deps array" → run
 * every render; a missing prev means first mount → changed; otherwise element-wise `Object.is`.
 */
export function depsChanged(
  prev: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
): boolean {
  if (next === undefined) return true; // no deps array → always "changed"
  if (prev === undefined) return true; // first mount
  if (prev.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}

export function createRoot<P = undefined, R = unknown>(
  _component: Component<P, R>,
  _initialProps?: P,
): Root<P, R> {
  // Assigning `currentFiber` during render is how getCurrentFiber() finds the fiber — set it inside
  // your render loop and restore it afterward.
  throw new Error(
    "TODO: build the fiber, wire rerender, do an initial render, and return { render, getResult, unmount }",
  );
}

export type SetState<S> = (next: S | ((prev: S) => S)) => void;

export function useState<S>(_initial: S | (() => S)): [S, SetState<S>] {
  throw new Error(
    "TODO: read/create hooks[cursor], return [value, setState] where setState schedules a re-render",
  );
}
