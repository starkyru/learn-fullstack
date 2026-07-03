import { createContext, useContext, useReducer, type ReactNode } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";

/**
 * The SAME counter feature, three ways — to feel the trade-offs first-hand. The behavior is
 * identical; what differs is the ceremony and where the state lives.
 *   - Redux essence: a pure `(state, action) => state` reducer + a minimal dispatch store.
 *   - Zustand: actions co-located with state, no actions/reducers/providers.
 *   - Context + useReducer: no dependency, but every consumer re-renders on any change.
 * The written comparison lives in `docs/STATE-CHOICE.md`.
 */

export interface CounterState {
  count: number;
}

export type CounterAction = { type: "increment" } | { type: "reset" };

/** Shared pure reducer — the Redux/Context core. */
export function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "reset":
      return { count: 0 };
    default:
      return state;
  }
}

// --- 1. Redux essence: reducer + a tiny hand-rolled store -------------------------------------

export interface ReduxLikeStore {
  getState: () => CounterState;
  dispatch: (action: CounterAction) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createReduxCounter(): ReduxLikeStore {
  let state: CounterState = { count: 0 };
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch: (action) => {
      state = counterReducer(state, action);
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// --- 2. Zustand: actions inside state ---------------------------------------------------------

export interface ZustandCounter {
  count: number;
  increment: () => void;
  reset: () => void;
}

export function createZustandCounter(): StoreApi<ZustandCounter> {
  return createStore<ZustandCounter>((set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
    reset: () => set({ count: 0 }),
  }));
}

// --- 3. Context + useReducer ------------------------------------------------------------------

interface CounterContextValue {
  count: number;
  dispatch: (action: CounterAction) => void;
}

const CounterContext = createContext<CounterContextValue | null>(null);

export function CounterProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });
  return (
    <CounterContext.Provider value={{ count: state.count, dispatch }}>
      {children}
    </CounterContext.Provider>
  );
}

export function useCounterContext(): CounterContextValue {
  const value = useContext(CounterContext);
  if (value === null) {
    throw new Error("useCounterContext must be used within a CounterProvider");
  }
  return value;
}
