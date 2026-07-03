import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MouseEvent } from "react";
import { useDisclosure } from "../solution/03-prop-getters.js";

/** A minimal fake click event — the getter only reads `defaultPrevented`. */
function fakeClick(): MouseEvent<HTMLElement> {
  return { defaultPrevented: false } as MouseEvent<HTMLElement>;
}

describe("useDisclosure prop getters", () => {
  it("getButtonProps wires aria-expanded (closed) and aria-controls to the panel id", () => {
    const { result } = renderHook(() => useDisclosure({ id: "panel-1" }));
    const btn = result.current.getButtonProps();

    expect(btn["aria-expanded"]).toBe(false);
    expect(btn["aria-controls"]).toBe("panel-1");
    expect(typeof btn.onClick).toBe("function");
  });

  it("getPanelProps returns the id and `hidden` reflecting isOpen", () => {
    const { result } = renderHook(() => useDisclosure({ id: "panel-1" }));
    expect(result.current.getPanelProps()).toEqual({ id: "panel-1", hidden: true });

    act(() => result.current.open());
    expect(result.current.getPanelProps()).toEqual({ id: "panel-1", hidden: false });
  });

  it("button aria-controls and panel id share the SAME id (button ⇄ panel link)", () => {
    const { result } = renderHook(() => useDisclosure());
    const controls = result.current.getButtonProps()["aria-controls"];
    const panelId = result.current.getPanelProps().id;

    expect(controls).toBe(panelId);
    expect(controls).not.toBe(""); // an auto-generated id was produced
  });

  it("onClick composes the caller handler AND the internal toggle (both fire)", () => {
    const callerClick = vi.fn();
    const { result } = renderHook(() => useDisclosure({ id: "p" }));
    const event = fakeClick();

    act(() => {
      result.current.getButtonProps({ onClick: callerClick }).onClick(event);
    });

    expect(callerClick).toHaveBeenCalledTimes(1);
    expect(callerClick).toHaveBeenCalledWith(event); // caller's handler received the event
    expect(result.current.isOpen).toBe(true); // internal toggle also ran
    expect(result.current.getButtonProps()["aria-expanded"]).toBe(true); // aria flipped
  });

  it("a caller handler that prevents the event suppresses the internal toggle", () => {
    const { result } = renderHook(() => useDisclosure({ id: "p" }));

    // Caller marks the event as prevented BEFORE the composed handler checks the guard.
    const preventedEvent = { defaultPrevented: true } as MouseEvent<HTMLElement>;
    const callerClick = vi.fn();

    act(() => {
      result.current.getButtonProps({ onClick: callerClick }).onClick(preventedEvent);
    });

    expect(callerClick).toHaveBeenCalledTimes(1); // caller still ran
    expect(result.current.isOpen).toBe(false); // internal toggle was skipped
    expect(result.current.getButtonProps()["aria-expanded"]).toBe(false);

    // A non-prevented event DOES toggle, proving the guard is what gates it.
    const openEvent = fakeClick();
    act(() => {
      result.current.getButtonProps({ onClick: callerClick }).onClick(openEvent);
    });
    expect(callerClick).toHaveBeenCalledTimes(2);
    expect(result.current.isOpen).toBe(true); // internal toggle ran this time
  });

  it("aria-expanded flips exactly true→false→true across toggles", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.getButtonProps()["aria-expanded"]).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.getButtonProps()["aria-expanded"]).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.getButtonProps()["aria-expanded"]).toBe(false);
  });

  it("merges caller-supplied extra props onto the button without dropping the hook's props", () => {
    const { result } = renderHook(() => useDisclosure({ id: "p" }));
    const props = result.current.getButtonProps({ type: "button", className: "trigger" });

    expect(props.type).toBe("button"); // caller prop survived
    expect(props.className).toBe("trigger"); // caller prop survived
    expect(props["aria-controls"]).toBe("p"); // hook prop still applied
  });
});
