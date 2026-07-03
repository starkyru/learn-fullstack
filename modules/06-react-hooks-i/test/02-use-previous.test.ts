import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePrevious } from "../solution/02-use-previous.js";

describe("usePrevious", () => {
  it("is undefined on first render, then the prior value", () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), {
      initialProps: { v: 1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ v: 2 });
    expect(result.current).toBe(1);
    rerender({ v: 3 });
    expect(result.current).toBe(2);
  });
});
