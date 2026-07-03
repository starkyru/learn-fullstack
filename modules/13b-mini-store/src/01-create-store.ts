/**
 * Build a Zustand-shaped store from scratch: a closure over `state` + a `Set` of listeners.
 *
 * YOUR TURN — implement `createStore`:
 *   - getState(): return current state.
 *   - setState(partial, replace?): accept an object OR an updater fn; shallow-merge (or replace);
 *     notify every listener with (nextState, prevState); skip notify if nothing changed.
 *   - subscribe(listener): add it, RETURN an unsubscribe that removes it (no leak).
 *   - build the initial state by calling the initializer with (set, get) LAST.
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

export function createStore<T extends object>(
  _initializer: StateCreator<T>,
): StoreApi<T> {
  throw new Error("TODO: build the store closure (getState / setState / subscribe)");
}
