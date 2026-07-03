import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCounter } from "../solution/01-use-reducer.js";

describe("useCounter", () => {
  it("increments, decrements, and resets", () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
    act(() => result.current.inc());
    act(() => result.current.inc());
    expect(result.current.count).toBe(7);
    act(() => result.current.dec());
    expect(result.current.count).toBe(6);
    act(() => result.current.reset());
    expect(result.current.count).toBe(5);
  });
});
