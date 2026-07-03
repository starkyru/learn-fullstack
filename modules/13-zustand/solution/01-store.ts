import { createStore, type StoreApi } from "zustand/vanilla";

/**
 * A Zustand store is just a closure over state with `getState` / `setState` / `subscribe`.
 * Actions live INSIDE the state object — `set` merges a partial (shallow) into the current state.
 * We use `zustand/vanilla` (not the React `create`) so each `createXStore()` call is an isolated
 * instance: no module singleton, trivially testable with `.getState()` / `.subscribe()`.
 */

export type Theme = "light" | "dark";

export interface ThemeUiState {
  theme: Theme;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

/** Solved reference: a theme + chrome store. Note actions call `set` with a partial. */
export function createThemeStore(): StoreApi<ThemeUiState> {
  return createStore<ThemeUiState>((set) => ({
    theme: "light",
    sidebarOpen: false,
    toggleTheme: () =>
      set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    setTheme: (theme) => set({ theme }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  }));
}

export interface BoardUiState {
  selectedCardId: string | null;
  draggingId: string | null;
  select: (id: string | null) => void;
  beginDrag: (id: string) => void;
  endDrag: () => void;
}

/**
 * Analog store — same shape, different domain. Board-chrome UI (which card is selected, what is
 * mid-drag). `beginDrag` records the id; `endDrag` clears it. `select` sets or clears selection.
 */
export function createBoardUiStore(): StoreApi<BoardUiState> {
  return createStore<BoardUiState>((set) => ({
    selectedCardId: null,
    draggingId: null,
    select: (selectedCardId) => set({ selectedCardId }),
    beginDrag: (draggingId) => set({ draggingId }),
    endDrag: () => set({ draggingId: null }),
  }));
}
