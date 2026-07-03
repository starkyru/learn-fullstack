import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStore, type StoreApi } from "../solution/01-create-store.js";
import { shallow, useStore } from "../solution/02-use-store.js";

interface S {
  count: number;
  theme: "light" | "dark";
  inc: () => void;
  toggle: () => void;
}

function makeStore(): StoreApi<S> {
  return createStore<S>((set) => ({
    count: 0,
    theme: "light",
    inc: () => set((s) => ({ count: s.count + 1 })),
    toggle: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  }));
}

describe("useStore selector isolation", () => {
  it("primitive selector re-renders on its slice, NOT on an unrelated change", () => {
    const store = makeStore();
    let renders = 0;
    function Probe() {
      renders++;
      const count = useStore(store, (s) => s.count);
      return <span data-testid="v">{count}</span>;
    }
    render(<Probe />);
    expect(renders).toBe(1);

    act(() => store.getState().toggle()); // unrelated slice
    expect(renders).toBe(1);

    act(() => store.getState().inc());
    expect(renders).toBe(2);
    expect(screen.getByTestId("v").textContent).toBe("1");
  });

  it("object selector with default equality re-renders on any change but does NOT loop", () => {
    // Fresh object each call → Object.is false on every store change → re-render. The state-identity
    // cache is what keeps getSnapshot stable WITHIN a render, so React does not throw an infinite loop.
    const store = makeStore();
    let renders = 0;
    function Probe() {
      renders++;
      const view = useStore(store, (s) => ({ count: s.count }));
      return <span>{view.count}</span>;
    }
    render(<Probe />);
    expect(renders).toBe(1);

    act(() => store.getState().toggle()); // count unchanged, yet new object ref
    expect(renders).toBe(2);
  });

  it("object selector with `shallow` ignores unrelated changes", () => {
    const store = makeStore();
    let renders = 0;
    function Probe() {
      renders++;
      const view = useStore(store, (s) => ({ count: s.count }), shallow);
      return <span>{view.count}</span>;
    }
    render(<Probe />);
    expect(renders).toBe(1);

    act(() => store.getState().toggle());
    expect(renders).toBe(1); // shallow-equal selection → no re-render

    act(() => store.getState().inc());
    expect(renders).toBe(2);
  });

  it("unsubscribes from the store on unmount (no listener leak)", () => {
    // The whole point of the useSyncExternalStore binding is that React calls the
    // unsubscribe returned by `subscribe` on unmount. Wrap the real subscribe so we can
    // assert the returned cleanup actually ran — and that no listeners remain afterward.
    const store = makeStore();
    let unsubCalls = 0;
    let liveListeners = 0;
    const realSubscribe = store.subscribe;
    store.subscribe = (listener) => {
      liveListeners++;
      const unsub = realSubscribe(listener);
      return () => {
        unsubCalls++;
        liveListeners--;
        unsub();
      };
    };
    function Probe() {
      const count = useStore(store, (s) => s.count);
      return <span>{count}</span>;
    }
    const { unmount } = render(<Probe />);
    expect(liveListeners).toBe(1);

    unmount();
    expect(unsubCalls).toBe(1);
    expect(liveListeners).toBe(0);

    // A post-unmount store change must not reach the unmounted component (would warn/throw).
    act(() => store.getState().inc());
    expect(liveListeners).toBe(0);
  });
});

describe("shallow", () => {
  it("compares one level of fields, not identity", () => {
    expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallow({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false); // key count differs
    expect(shallow(3, 3)).toBe(true);
    expect(shallow(3, 4)).toBe(false);
    expect(shallow(null, { a: 1 })).toBe(false);
  });
});
