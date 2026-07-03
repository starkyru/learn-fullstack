import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoCounter } from "../solution/04-pitfalls.js";

describe("AutoCounter (stale-closure fix)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("increments once per interval past 1 (functional updater, no stale closure)", () => {
    render(<AutoCounter intervalMs={1000} />);
    const output = screen.getByText("0");

    act(() => {
      vi.advanceTimersByTime(3000); // three ticks
    });

    // The buggy stale-closure version freezes at "1"; the fix reaches "3".
    expect(output).toHaveTextContent("3");
  });

  it("stops incrementing after unmount (interval cleaned up)", () => {
    const { unmount } = render(<AutoCounter intervalMs={1000} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("1")).toBeInTheDocument();

    unmount();
    // No timers should remain pending after cleanup.
    expect(vi.getTimerCount()).toBe(0);
  });
});
