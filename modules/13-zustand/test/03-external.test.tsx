import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery, useWindowWidth } from "../solution/03-external.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function WidthProbe() {
  const width = useWindowWidth();
  return <span data-testid="w">{width}</span>;
}

describe("useWindowWidth", () => {
  it("reflects innerWidth and updates when a resize fires", () => {
    window.innerWidth = 800;
    render(<WidthProbe />);
    expect(screen.getByTestId("w").textContent).toBe("800");

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByTestId("w").textContent).toBe("500");
  });

  it("removes the SAME resize listener it added on unmount (no leak)", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<WidthProbe />);

    const added = addSpy.mock.calls.find(([type]) => type === "resize")?.[1];
    expect(added).toBeTypeOf("function");

    unmount();
    // Must remove the exact listener that was added — a cleanup that removes a *different*
    // function (or none) leaks the real one. `expect.any(Function)` would not catch that.
    expect(removeSpy).toHaveBeenCalledWith("resize", added);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe("useMediaQuery", () => {
  // A fake MediaQueryList — the true external boundary — with real add/remove spies so we can
  // assert the hook subscribes AND unsubscribes with the same handler.
  function makeMql() {
    let matches = false;
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const mql = {
      get matches() {
        return matches;
      },
      setMatches(value: boolean) {
        matches = value;
      },
      addEventListener,
      removeEventListener,
      // the handler the hook registered, for firing 'change' and identity checks
      get handler() {
        return addEventListener.mock.calls[0]?.[1] as (() => void) | undefined;
      },
    };
    return mql;
  }

  function Probe() {
    const wide = useMediaQuery("(min-width: 600px)");
    return <span data-testid="m">{String(wide)}</span>;
  }

  it("tracks matchMedia().matches and updates on 'change'", () => {
    const mql = makeMql();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    render(<Probe />);
    expect(screen.getByTestId("m").textContent).toBe("false");

    act(() => {
      mql.setMatches(true);
      mql.handler?.();
    });
    expect(screen.getByTestId("m").textContent).toBe("true");
  });

  it("removes the SAME change listener it added on unmount (no leak)", () => {
    const mql = makeMql();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    const { unmount } = render(<Probe />);
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    const added = mql.handler;

    unmount();
    // Dropping cleanup (or removing a different fn) leaks a matchMedia listener per unmount —
    // the exact bug the module warns about. Assert the added handler itself is removed.
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", added);
  });
});
