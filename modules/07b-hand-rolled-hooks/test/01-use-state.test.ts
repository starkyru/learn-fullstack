import { describe, expect, it, vi } from "vitest";
import { createRoot, useState } from "../solution/01-use-state.js";

describe("createRoot + useState", () => {
  it("mounts with the initial state and re-renders on setState", () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return { count, setCount };
    }
    const root = createRoot(Counter);
    expect(root.getResult().count).toBe(0);

    root.getResult().setCount(1);
    expect(root.getResult().count).toBe(1);
  });

  it("a setState triggers exactly one re-render", () => {
    let renders = 0;
    function Counter() {
      renders++;
      const [n, setN] = useState(0);
      return { n, setN };
    }
    const root = createRoot(Counter);
    expect(renders).toBe(1); // just the initial mount

    root.getResult().setN(5);
    expect(renders).toBe(2); // exactly one more render, not zero and not two
    expect(root.getResult().n).toBe(5);
  });

  it("a functional updater receives the previous value", () => {
    function Counter() {
      const [n, setN] = useState(10);
      return { n, setN };
    }
    const root = createRoot(Counter);
    root.getResult().setN((prev) => prev + 5);
    expect(root.getResult().n).toBe(15);
  });

  it("runs a lazy initializer once, not on every render", () => {
    const init = vi.fn(() => 7);
    function Counter() {
      const [n, setN] = useState(init);
      return { n, setN };
    }
    const root = createRoot(Counter);
    expect(root.getResult().n).toBe(7);

    root.getResult().setN(8); // forces a re-render
    expect(root.getResult().n).toBe(8);
    expect(init).toHaveBeenCalledTimes(1); // initializer not re-run on re-render
  });

  it("bails out (no re-render) when setState is called with an Object.is-equal value", () => {
    let renders = 0;
    function Counter() {
      renders++;
      const [n, setN] = useState(3);
      return { n, setN };
    }
    const root = createRoot(Counter);
    expect(renders).toBe(1);

    root.getResult().setN(3); // same value → no state change
    expect(renders).toBe(1); // no re-render was scheduled
  });

  it("bails out when setState is called with NaN (Object.is semantics, not ===)", () => {
    let renders = 0;
    function Counter() {
      renders++;
      const [n, setN] = useState(NaN);
      return { n, setN };
    }
    const root = createRoot(Counter);
    expect(renders).toBe(1);

    // Object.is(NaN, NaN) === true → bail out. (NaN === NaN would be false and force a re-render.)
    root.getResult().setN(NaN);
    expect(renders).toBe(1); // no re-render because the value is Object.is-equal
  });

  it("keeps multiple useState cells independent by call order, with a stable setState identity", () => {
    function Two() {
      const [a, setA] = useState("a");
      const [b, setB] = useState("b");
      return { a, setA, b, setB };
    }
    const root = createRoot(Two);
    const firstSetA = root.getResult().setA;

    root.getResult().setB("B");
    expect(root.getResult().a).toBe("a"); // the other cell is untouched
    expect(root.getResult().b).toBe("B");
    expect(root.getResult().setA).toBe(firstSetA); // dispatch is stable across renders
  });
});
