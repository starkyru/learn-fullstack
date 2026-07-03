import { describe, expect, it, vi } from "vitest";
import { createBoardUiStore, createThemeStore } from "../solution/01-store.js";

describe("theme store", () => {
  it("toggles theme + sidebar and sets theme directly", () => {
    const store = createThemeStore();
    expect(store.getState().theme).toBe("light");

    store.getState().toggleTheme();
    expect(store.getState().theme).toBe("dark");

    store.getState().setTheme("light");
    expect(store.getState().theme).toBe("light");

    expect(store.getState().sidebarOpen).toBe(false);
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(true);
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const store = createThemeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.getState().toggleTheme();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.getState().toggleTheme();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("board UI store", () => {
  it("selects, begins/ends drag; endDrag leaves selection intact", () => {
    const store = createBoardUiStore();
    expect(store.getState().selectedCardId).toBeNull();
    expect(store.getState().draggingId).toBeNull();

    store.getState().select("card-1");
    expect(store.getState().selectedCardId).toBe("card-1");

    store.getState().beginDrag("card-2");
    expect(store.getState().draggingId).toBe("card-2");

    store.getState().endDrag();
    expect(store.getState().draggingId).toBeNull();
    expect(store.getState().selectedCardId).toBe("card-1"); // endDrag must not touch selection

    store.getState().select(null);
    expect(store.getState().selectedCardId).toBeNull();
  });
});
