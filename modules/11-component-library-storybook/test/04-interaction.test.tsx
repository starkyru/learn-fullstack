import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { modalPlay } from "../solution/04-interaction.js";
import { Modal } from "../solution/03-overlay.js";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirm">
        <button>First</button>
        <button>Last</button>
      </Modal>
    </div>
  );
}

/**
 * A dialog that PASSES the initial-focus check (autofocus on First) but has NO focus trap,
 * and an `Outside` focusable ahead of it so Tab from `Last` escapes the dialog. This forces
 * `modalPlay` to reach and fail its trap assertion specifically — a play function that only
 * checked initial focus and skipped the trap would wrongly resolve here.
 */
function UntrappedDialog() {
  return (
    <div>
      <button>Outside</button>
      <div role="dialog" aria-modal="true" aria-label="Untrapped">
        <button autoFocus>First</button>
        <button>Last</button>
      </div>
    </div>
  );
}

/**
 * A dialog that autofocuses First and traps Tab correctly, but has NO Escape handling. This
 * forces `modalPlay` past steps 1–2 so its step-3 Escape assertion is the one that fires — a
 * play function that pressed Escape but skipped the "did it actually close?" check would
 * wrongly resolve here.
 */
function TrapNoEscapeDialog() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>("button") ?? []);
    nodes()[0]?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return; // deliberately ignores Escape
      const list = nodes();
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Trap no escape">
      <button>First</button>
      <button>Last</button>
    </div>
  );
}

describe("modalPlay", () => {
  it("passes against the real Modal (focus, trap, Escape all hold)", async () => {
    render(<ModalHarness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    // canvasElement is document.body because the Modal portals there.
    await expect(modalPlay({ canvasElement: document.body })).resolves.toBeUndefined();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rejects when the focus trap is broken (proves play checks the trap, not just focus)", async () => {
    render(<UntrappedDialog />);
    await expect(modalPlay({ canvasElement: document.body })).rejects.toThrow(
      /focus trap/,
    );
  });

  it("rejects when Escape does not close (proves play verifies the dialog actually left)", async () => {
    render(<TrapNoEscapeDialog />);
    await expect(modalPlay({ canvasElement: document.body })).rejects.toThrow(
      /Escape did not close/,
    );
  });
});
