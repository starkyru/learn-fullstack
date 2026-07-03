/**
 * A Zustand-shaped store, from scratch — no library. The whole thing is a closure over `state` and
 * a `Set` of listeners. That is the entire "external store" contract that `useSyncExternalStore`
 * consumes: `getState` + `subscribe` (+ a `setState` to drive it).
 *
 *   - `setState(partial)` accepts an object OR an updater `(state) => partial`, SHALLOW-merges it
 *     (like React's old `setState`), and notifies every listener. Pass `replace = true` to swap the
 *     whole state instead of merging.
 *   - `subscribe(listener)` returns an unsubscribe — call it and the listener is gone (no leak).
 *   - The initializer gets `set` and `get`, so actions live inside the state object and can read the
 *     latest state via `get()`.
 */

export type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean,
) => void;

export type GetState<T> = () => T;

export type Listener<T> = (state: T, previous: T) => void;

export type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export interface StoreApi<T> {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: Listener<T>) => () => void;
}

export function createStore<T extends object>(initializer: StateCreator<T>): StoreApi<T> {
  let state: T;
  const listeners = new Set<Listener<T>>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial, replace) => {
    const nextPartial =
      typeof partial === "function"
        ? (partial as (state: T) => Partial<T>)(state)
        : partial;
    const previous = state;
    // Replace swaps wholesale; otherwise shallow-merge onto the current state.
    const next = replace ? (nextPartial as T) : { ...state, ...nextPartial };
    // Skip the notify if nothing actually changed (a `replace` with the identical ref).
    if (Object.is(next, previous)) return;
    state = next;
    for (const listener of listeners) listener(state, previous);
  };

  const subscribe = (listener: Listener<T>): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // Build the initial state LAST — the initializer may capture `set`/`get` for its actions.
  state = initializer(setState, getState);

  return { getState, setState, subscribe };
}
