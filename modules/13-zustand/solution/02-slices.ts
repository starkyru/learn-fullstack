import { createStore, type StoreApi } from "zustand/vanilla";

/**
 * SLICES: one store, split into independent creators that each own a concern. A slice creator has
 * the same signature as the store initializer — `(set, get) => ({...})` — so combining them is
 * just spreading their results into one object.
 *
 * SELECTORS + shallow: `useStore(store, selector)` re-renders only when the SELECTED value changes
 * (compared with `Object.is`). A selector returning a primitive (`s => s.count`) is already
 * isolated. A selector returning a fresh OBJECT (`s => ({ count: s.count })`) makes a new reference
 * every store change, so it would re-render on unrelated updates — wrap it in `useShallow` to
 * compare the object's fields instead of its identity.
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

export const createCounterSlice = (set: SetState): CounterSlice => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
});

export const createThemeSlice = (set: SetState): ThemeSlice => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
});

/** Combine the slices into one store — each slice stays authored in isolation. */
export function createAppStore(): StoreApi<AppState> {
  return createStore<AppState>((set) => ({
    ...createCounterSlice(set),
    ...createThemeSlice(set),
  }));
}

/** Primitive selector — already re-render-isolated (Object.is on a number). */
export const selectCount = (state: AppState): number => state.count;

/** Object selector — needs `useShallow` at the call site to avoid a new-ref re-render. */
export const selectCounterView = (state: AppState): { count: number } => ({
  count: state.count,
});
