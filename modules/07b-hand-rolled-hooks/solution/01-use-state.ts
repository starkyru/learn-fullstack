/**
 * A tiny React-like renderer, from scratch — NOT real React. The whole magic of hooks is here: a
 * component is just a function, and its "memory" lives in an array of hook cells on a per-component
 * "fiber". Each render resets a cursor to 0 and every hook call reads/creates `hooks[cursor++]`, so
 * hooks are matched to their cell purely by CALL ORDER. That stable order is exactly why the rules of
 * hooks exist: call the same hooks in the same order every render, or the cursor points at the wrong
 * cell. (`if (cond) useState()` would shift every later hook by one.)
 *
 *   - `createRoot(component, props?)` builds a fiber, does an initial render, and returns a handle to
 *     re-render (with new props), read the last result, or unmount (running effect cleanups).
 *   - `useState(initial)` reads/creates its cell, returns `[value, setState]`. `setState` writes the
 *     cell and schedules a synchronous re-render — unless the value is `Object.is`-equal (bail out).
 *   - The "dispatcher" is the module-level `currentFiber`: hooks in the sibling files (`useEffect`,
 *     `useMemo`, `useRef`) call `getCurrentFiber()` to reach the same cell array + cursor.
 */

export type Component<P, R> = (props: P) => R;

/**
 * One slot in a fiber's hook array. Different hooks use different fields, but the cell is matched to
 * its hook by index, not by shape: `memoizedState` (state value / memo value / the `{ current }` ref
 * box), `deps` (last dependency array), `cleanup` (an effect's teardown), `dispatch` (a stable
 * `setState`).
 */
export interface HookCell {
  memoizedState: unknown;
  deps?: readonly unknown[] | undefined;
  cleanup?: (() => void) | undefined;
  dispatch?: unknown;
}

/** The hook-facing view of a fiber — all a hook needs to reach the current cell array + cursor. */
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
  /** Re-render (optionally with new props) and return the component's result. */
  render: (nextProps?: P) => R;
  /** The result of the most recent render, without re-rendering. */
  getResult: () => R;
  /** Tear down: run every effect cleanup and forget the hook cells. */
  unmount: () => void;
}

// The "dispatcher": the fiber currently rendering. Hooks read it via getCurrentFiber().
let currentFiber: HookState | null = null;

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

function renderFiber<P, R>(fiber: Fiber<P, R>): R {
  const previousFiber = currentFiber;
  currentFiber = fiber;
  fiber.cursor = 0; // reset the cursor so hooks re-bind to their cells by order
  fiber.pendingEffects = [];
  let result: R;
  try {
    result = fiber.component(fiber.props);
  } finally {
    currentFiber = previousFiber;
  }
  fiber.result = result;
  fiber.isMounted = true;

  // Effects run AFTER the render pass, in declaration order (like React's commit phase).
  const effects = fiber.pendingEffects;
  fiber.pendingEffects = [];
  for (const runEffect of effects) runEffect();

  return result;
}

export function createRoot<P = undefined, R = unknown>(
  component: Component<P, R>,
  initialProps?: P,
): Root<P, R> {
  const fiber: Fiber<P, R> = {
    component,
    props: initialProps as P,
    result: undefined as unknown as R,
    hooks: [],
    cursor: 0,
    pendingEffects: [],
    isMounted: false,
    rerender: () => undefined,
  };
  // Wire the scheduler: a setState calls fiber.rerender() to re-invoke the component synchronously.
  fiber.rerender = () => {
    renderFiber(fiber);
  };

  const render = (nextProps?: P): R => {
    if (nextProps !== undefined) fiber.props = nextProps;
    return renderFiber(fiber);
  };

  const unmount = (): void => {
    for (const hook of fiber.hooks) {
      if (typeof hook.cleanup === "function") {
        hook.cleanup();
        hook.cleanup = undefined;
      }
    }
    fiber.hooks = [];
    fiber.isMounted = false;
  };

  render(); // initial mount
  return { render, getResult: () => fiber.result, unmount };
}

export type SetState<S> = (next: S | ((prev: S) => S)) => void;

export function useState<S>(initial: S | (() => S)): [S, SetState<S>] {
  const fiber = getCurrentFiber();
  const index = fiber.cursor;
  let hook = fiber.hooks[index];

  if (hook === undefined) {
    const initialValue = typeof initial === "function" ? (initial as () => S)() : initial;
    const cell: HookCell = { memoizedState: initialValue };
    // A STABLE dispatch, created once on mount and reused every render. It closes over the cell (so
    // it always reads/writes the latest value) and the fiber (to schedule a re-render).
    const dispatch: SetState<S> = (next) => {
      const prev = cell.memoizedState as S;
      const value = typeof next === "function" ? (next as (p: S) => S)(prev) : next;
      if (Object.is(value, prev)) return; // no change → bail out, no re-render
      cell.memoizedState = value;
      fiber.rerender();
    };
    cell.dispatch = dispatch;
    fiber.hooks[index] = cell;
    hook = cell;
  }

  fiber.cursor++;
  return [hook.memoizedState as S, hook.dispatch as SetState<S>];
}
