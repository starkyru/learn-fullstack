import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  createAppStore,
  selectCount,
  selectCounterView,
  type AppState,
} from "../solution/02-slices.js";

describe("slices combine into one store", () => {
  it("both slices' state and actions coexist", () => {
    const store = createAppStore();
    const state = store.getState();
    expect(state.count).toBe(0);
    expect(state.theme).toBe("light");

    state.increment();
    expect(store.getState().count).toBe(1);
    state.toggleTheme();
    expect(store.getState().theme).toBe("dark");
    state.reset();
    expect(store.getState().count).toBe(0);
  });
});

describe("selector re-render isolation", () => {
  it("primitive selector: re-renders on count change, NOT on unrelated theme toggle", () => {
    const store = createAppStore();
    let renders = 0;
    function Probe() {
      renders++;
      const count = useStore(store, selectCount);
      return <span data-testid="v">{count}</span>;
    }
    render(<Probe />);
    expect(renders).toBe(1);

    act(() => store.getState().toggleTheme()); // other slice
    expect(renders).toBe(1); // isolated — no re-render

    act(() => store.getState().increment());
    expect(renders).toBe(2);
    expect(screen.getByTestId("v").textContent).toBe("1");
  });

  it("object selector WITHOUT useShallow trips React's infinite-loop guard (the pitfall)", () => {
    // A selector returning a FRESH object every call never compares equal under Object.is, so
    // useSyncExternalStore re-renders forever — React aborts with "Maximum update depth exceeded".
    // This is exactly why zustand v5 dropped auto-shallow and forces `useShallow` (next test).
    // NOTE: the message text is React-internal and could change across major versions; the
    // discriminating signal here is that render THROWS at all, not the exact wording.
    const store = createAppStore();
    function Probe() {
      const view = useStore(store, selectCounterView); // new object each render
      return <span>{view.count}</span>;
    }
    expect(() => render(<Probe />)).toThrow(/Maximum update depth exceeded/);
  });

  it("object selector WITH useShallow ignores unrelated changes", () => {
    const store = createAppStore();
    let renders = 0;
    function Probe() {
      renders++;
      const view = useStore(
        store,
        useShallow<AppState, { count: number }>(selectCounterView),
      );
      return <span>{view.count}</span>;
    }
    render(<Probe />);
    expect(renders).toBe(1);

    act(() => store.getState().toggleTheme());
    expect(renders).toBe(1); // shallow-equal → no re-render

    act(() => store.getState().increment());
    expect(renders).toBe(2); // selected field changed → re-render
  });
});
