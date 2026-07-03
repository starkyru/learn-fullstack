import { describe, expect, it, vi } from "vitest";
import {
  prefersReducedMotion,
  withViewTransition,
  type ViewTransition,
} from "../solution/04-view-transitions.js";

describe("withViewTransition", () => {
  it("animated path: runs the update INSIDE startViewTransition (called once), never eagerly", () => {
    const update = vi.fn();
    let captured: (() => void) | undefined;
    const startViewTransition = vi.fn((cb: () => void): ViewTransition => {
      captured = cb; // capture but don't run — prove the helper handed ownership over
      return { finished: Promise.resolve() };
    });

    const result = withViewTransition(update, { startViewTransition });

    expect(result).toEqual({ animated: true });
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled(); // the transition owns the DOM mutation
    captured?.();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("reduced-motion path: applies instantly and NEVER calls startViewTransition", () => {
    const update = vi.fn();
    const startViewTransition = vi.fn();

    const result = withViewTransition(update, {
      startViewTransition,
      reducedMotion: true,
    });

    expect(result).toEqual({ animated: false });
    expect(update).toHaveBeenCalledTimes(1);
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("unsupported browser (no startViewTransition): applies the update instantly", () => {
    const update = vi.fn();
    const result = withViewTransition(update, {});
    expect(result).toEqual({ animated: false });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("prefersReducedMotion reads a MediaQueryList and defaults to false when absent", () => {
    expect(prefersReducedMotion({ matches: true })).toBe(true);
    expect(prefersReducedMotion({ matches: false })).toBe(false);
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});
