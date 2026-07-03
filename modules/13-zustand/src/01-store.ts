import { createStore, type StoreApi } from "zustand/vanilla";

/**
 * A Zustand store is just a closure over state with `getState` / `setState` / `subscribe`.
 * Actions live INSIDE the state object — `set` merges a partial (shallow) into the current state.
 * We use `zustand/vanilla` so each `createXStore()` call is an isolated instance.
 *
 * Task 1 is a worked example: `createThemeStore` below is solved. Implement the analog
 * `createBoardUiStore` to match — same shape, board-chrome domain.
 */

export type Theme = "light" | "dark";

export interface ThemeUiState {
  theme: Theme;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

/** Solved reference. */
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
 * YOUR TURN — mirror the pattern above:
 *   select(id): set selectedCardId · beginDrag(id): set draggingId · endDrag(): clear draggingId.
 */
export function createBoardUiStore(): StoreApi<BoardUiState> {
  throw new Error("TODO: build the board-UI store (select / beginDrag / endDrag)");
}
