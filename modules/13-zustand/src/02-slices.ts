import { createStore, type StoreApi } from "zustand/vanilla";

/**
 * SLICES: one store split into independent creators, each `(set) => ({...})`, combined by spreading.
 * SELECTORS: `useStore(store, selector)` re-renders only when the SELECTED value changes (Object.is).
 * A primitive selector is already isolated; an object selector needs `useShallow` at the call site.
 *
 * YOUR TURN — implement the two slice creators and combine them in `createAppStore`.
 */

export type Theme = "light" | "dark";

export interface CounterSlice {
  count: number;
  increment: () => void;
  reset: () => void;
}

export interface ThemeSlice {
  theme: Theme;
  toggleTheme: () => void;
}

export type AppState = CounterSlice & ThemeSlice;

type SetState = StoreApi<AppState>["setState"];

export const createCounterSlice = (_set: SetState): CounterSlice => {
  throw new Error("TODO: return { count, increment, reset } using set");
};

export const createThemeSlice = (_set: SetState): ThemeSlice => {
  throw new Error("TODO: return { theme, toggleTheme } using set");
};

export function createAppStore(): StoreApi<AppState> {
  throw new Error("TODO: combine the two slices into one store");
}

export const selectCount = (state: AppState): number => state.count;

export const selectCounterView = (state: AppState): { count: number } => ({
  count: state.count,
});
