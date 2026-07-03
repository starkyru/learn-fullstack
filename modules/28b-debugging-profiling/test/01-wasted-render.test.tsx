// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BuggyParent,
  FixedParent,
  findWastedRender,
  type RenderRecord,
} from "../solution/01-wasted-render.js";

describe("wasted render — memo + stable identity", () => {
  it("BuggyParent: an inline object prop defeats memo — the child re-renders on every bump", () => {
    let childRenders = 0;
    const onChildRender = () => {
      childRenders++;
    };
    render(<BuggyParent onChildRender={onChildRender} />);
    expect(childRenders).toBe(1); // initial render

    const bump = screen.getByTestId("bump");
    fireEvent.click(bump);
    fireEvent.click(bump);
    fireEvent.click(bump);
    // Fresh `{ theme }` object each render → memo can't bail → one wasted render per bump.
    expect(childRenders).toBe(4);
  });

  it("FixedParent: stable prop identity lets memo bail — the child does NOT re-render on bumps", () => {
    let childRenders = 0;
    const onChildRender = () => {
      childRenders++;
    };
    render(<FixedParent onChildRender={onChildRender} />);
    expect(childRenders).toBe(1); // initial render

    const bump = screen.getByTestId("bump");
    fireEvent.click(bump);
    fireEvent.click(bump);
    fireEvent.click(bump);
    // config identity is stable → memo bails on the unrelated counter change → still one render.
    expect(childRenders).toBe(1);
    // The parent's own state still advanced, proving the re-renders really happened upstream.
    expect(bump.textContent).toBe("3");
    expect(screen.getByTestId("child").textContent).toBe("light");
  });

  it("FixedParent: a stable useCallback lets a memoized callback-child bail on unrelated bumps", () => {
    let actionRenders = 0;
    render(
      <FixedParent onChildRender={() => {}} onActionRender={() => actionRenders++} />,
    );
    expect(actionRenders).toBe(1); // initial render

    const bump = screen.getByTestId("bump");
    fireEvent.click(bump);
    fireEvent.click(bump);
    fireEvent.click(bump);
    // `bump` keeps a stable identity via useCallback → ActionChild's props are unchanged →
    // memo bails on every bump → still exactly one render. Drop useCallback (fresh arrow each
    // render) and this child re-renders once per bump instead (→ 4).
    expect(actionRenders).toBe(1);
    // The counter still advanced, proving the parent really re-rendered three times.
    expect(bump.textContent).toBe("3");
  });

  it("the fix strictly reduces child renders versus the bug for the same interaction", () => {
    let buggy = 0;
    let fixed = 0;
    const { unmount } = render(<BuggyParent onChildRender={() => buggy++} />);
    act(() => {
      fireEvent.click(screen.getByTestId("bump"));
    });
    unmount();
    render(<FixedParent onChildRender={() => fixed++} />);
    act(() => {
      fireEvent.click(screen.getByTestId("bump"));
    });
    expect(buggy).toBe(2); // initial + wasted
    expect(fixed).toBe(1); // initial only
  });
});

describe("findWastedRender", () => {
  it("counts renders whose props are shallow-equal to the same component's previous render", () => {
    const log: RenderRecord[] = [
      { component: "List", props: { items: 3 } },
      { component: "Row", props: { id: 1 } },
      { component: "Row", props: { id: 1 } }, // wasted: same as previous Row
      { component: "Row", props: { id: 2 } }, // changed
      { component: "List", props: { items: 3 } }, // wasted: same as previous List
      { component: "Row", props: { id: 2 } }, // wasted: same as previous Row
    ];
    expect(findWastedRender(log)).toEqual({ Row: 2, List: 1 });
  });

  it("treats a differing key count as changed, not wasted", () => {
    const log: RenderRecord[] = [
      { component: "Card", props: { a: 1 } },
      { component: "Card", props: { a: 1, b: 2 } }, // extra key → changed
    ];
    expect(findWastedRender(log)).toEqual({});
  });

  it("returns an empty map when every render changes something", () => {
    const log: RenderRecord[] = [
      { component: "X", props: { v: 1 } },
      { component: "X", props: { v: 2 } },
      { component: "X", props: { v: 3 } },
    ];
    expect(findWastedRender(log)).toEqual({});
  });
});
