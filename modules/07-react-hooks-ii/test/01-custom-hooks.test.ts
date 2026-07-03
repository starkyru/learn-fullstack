import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../solution/01-custom-hooks.js";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("updates only after the delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), {
      initialProps: { v: "a" },
    });
    expect(result.current).toBe("a");
    rerender({ v: "b" });
    expect(result.current).toBe("a"); // not yet
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });
});
