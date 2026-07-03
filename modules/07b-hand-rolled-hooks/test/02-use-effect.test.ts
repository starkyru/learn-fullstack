import { describe, expect, it, vi } from "vitest";
import { createRoot, useState } from "../solution/01-use-state.js";
import { useEffect } from "../solution/02-use-effect.js";

describe("useEffect", () => {
  it("runs the effect AFTER the render pass, not during it", () => {
    const order: string[] = [];
    function C() {
      order.push("render");
      useEffect(() => {
        order.push("effect");
      }, []);
      // Marker AFTER the useEffect call: if the effect fired synchronously during the call it would
      // land BEFORE this marker. A real commit-phase effect runs after the whole body returns.
      order.push("after-render");
      return null;
    }
    createRoot(C);
    expect(order).toEqual(["render", "after-render", "effect"]); // effect after the ENTIRE body
  });

  it("does not re-run when a NaN dep is unchanged (Object.is semantics, not ===)", () => {
    const effect = vi.fn();
    function C() {
      const [, setN] = useState(0);
      useEffect(effect, [NaN]); // NaN dep — Object.is(NaN, NaN) is true, but NaN === NaN is false
      return { setN };
    }
    const root = createRoot(C);
    expect(effect).toHaveBeenCalledTimes(1);

    root.getResult().setN(1); // re-render; dep is still NaN → must be treated as unchanged
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("re-runs when the deps array LENGTH shrinks between renders", () => {
    const effect = vi.fn();
    function C({ long }: { long: boolean }) {
      // deps go from [1, 2] to [1]: element 0 is unchanged, ONLY the length differs, so the only
      // branch that can detect the change is the length-mismatch check in depsChanged.
      useEffect(effect, long ? [1, 2] : [1]);
      return null;
    }
    const root = createRoot(C, { long: true });
    expect(effect).toHaveBeenCalledTimes(1); // mount

    root.render({ long: false }); // [1, 2] → [1]
    expect(effect).toHaveBeenCalledTimes(2); // re-runs because the lengths differ
  });

  it("does not re-run when deps are unchanged across a re-render", () => {
    const effect = vi.fn();
    function C() {
      const [, setN] = useState(0);
      useEffect(effect, [1]); // constant dep
      return { setN };
    }
    const root = createRoot(C);
    expect(effect).toHaveBeenCalledTimes(1);

    root.getResult().setN(1); // re-render, but dep [1] is unchanged
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("re-runs on a dep change and runs the previous cleanup before the next effect", () => {
    const order: string[] = [];
    function C() {
      const [n, setN] = useState(0);
      useEffect(() => {
        order.push(`effect:${n}`);
        return () => order.push(`cleanup:${n}`);
      }, [n]);
      return { setN };
    }
    const root = createRoot(C);
    expect(order).toEqual(["effect:0"]);

    root.getResult().setN(1);
    expect(order).toEqual(["effect:0", "cleanup:0", "effect:1"]); // cleanup fires before re-run
  });

  it("runs the cleanup on unmount", () => {
    const cleanup = vi.fn();
    function C() {
      useEffect(() => cleanup, []);
      return null;
    }
    const root = createRoot(C);
    expect(cleanup).not.toHaveBeenCalled(); // not called while still mounted

    root.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("with no deps array, runs on every render", () => {
    const effect = vi.fn();
    function C() {
      const [, setN] = useState(0);
      useEffect(effect); // no deps → every render
      return { setN };
    }
    const root = createRoot(C);
    root.getResult().setN(1);
    root.getResult().setN(2);
    expect(effect).toHaveBeenCalledTimes(3); // mount + two re-renders
  });

  it("with an empty deps array, runs exactly once across many renders", () => {
    const effect = vi.fn();
    function C() {
      const [, setN] = useState(0);
      useEffect(effect, []);
      return { setN };
    }
    const root = createRoot(C);
    root.getResult().setN(1);
    root.getResult().setN(2);
    expect(effect).toHaveBeenCalledTimes(1);
  });
});
