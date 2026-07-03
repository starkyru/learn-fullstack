import { describe, expect, it, vi } from "vitest";
import { createRoot, useState } from "../solution/01-use-state.js";
import { useMemo, useRef } from "../solution/03-use-memo-ref.js";

describe("useMemo", () => {
  it("computes once and reuses the value while deps are unchanged", () => {
    const factory = vi.fn(() => 2 + 3);
    function C() {
      const [, setN] = useState(0);
      const sum = useMemo(() => factory(), []);
      return { sum, setN };
    }
    const root = createRoot(C);
    expect(root.getResult().sum).toBe(5);

    root.getResult().setN(1); // re-render, deps [] unchanged
    expect(factory).toHaveBeenCalledTimes(1); // not recomputed
  });

  it("recomputes when a dependency changes", () => {
    const factory = vi.fn((n: number) => n * 10);
    function C() {
      const [n, setN] = useState(1);
      const v = useMemo(() => factory(n), [n]);
      return { v, setN };
    }
    const root = createRoot(C);
    expect(root.getResult().v).toBe(10);

    root.getResult().setN(2);
    expect(root.getResult().v).toBe(20);
    expect(factory).toHaveBeenCalledTimes(2); // recomputed exactly once more
  });

  it("does not recompute when a NaN dep is unchanged (Object.is semantics, not ===)", () => {
    const factory = vi.fn(() => 5);
    function C() {
      const [, setN] = useState(0);
      const v = useMemo(() => factory(), [NaN]); // NaN dep — Object.is(NaN, NaN) is true
      return { v, setN };
    }
    const root = createRoot(C);
    expect(root.getResult().v).toBe(5);
    expect(factory).toHaveBeenCalledTimes(1);

    root.getResult().setN(1); // re-render; dep is still NaN → must be treated as unchanged
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns the same reference across renders while deps are unchanged", () => {
    function C() {
      const [, setN] = useState(0);
      const obj = useMemo(() => ({ id: 1 }), []);
      return { obj, setN };
    }
    const root = createRoot(C);
    const first = root.getResult().obj;

    root.getResult().setN(1);
    expect(root.getResult().obj).toBe(first); // identity preserved, not a fresh object
  });
});

describe("useRef", () => {
  it("returns a stable box across renders", () => {
    function C() {
      const [, setN] = useState(0);
      const ref = useRef(0);
      return { ref, setN };
    }
    const root = createRoot(C);
    const first = root.getResult().ref;

    root.getResult().setN(1);
    expect(root.getResult().ref).toBe(first); // same { current } object each render
  });

  it("persists current across renders and mutating it does not re-render", () => {
    let renders = 0;
    function C() {
      renders++;
      const [, setN] = useState(0);
      const ref = useRef(0);
      return { ref, setN };
    }
    const root = createRoot(C);

    root.getResult().ref.current = 42; // mutate — must not schedule a render
    expect(renders).toBe(1);

    root.getResult().setN(1); // force a real re-render
    expect(renders).toBe(2);
    expect(root.getResult().ref.current).toBe(42); // value survived the re-render
  });

  it("keeps the first initial value and ignores later initial args", () => {
    function C({ init }: { init: number }) {
      const ref = useRef(init);
      return { ref };
    }
    const root = createRoot(C, { init: 1 });
    expect(root.getResult().ref.current).toBe(1);

    root.render({ init: 999 }); // new prop, but the ref cell keeps its original box/value
    expect(root.getResult().ref.current).toBe(1);
  });
});
