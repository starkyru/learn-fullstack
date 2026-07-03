import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal, Toast } from "../solution/03-overlay.js";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirm delete">
        <button>First</button>
        <button>Last</button>
      </Modal>
    </div>
  );
}

describe("Modal", () => {
  it("is absent until opened, then exposes the dialog a11y contract", async () => {
    render(<ModalHarness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // aria-labelledby resolves to the title (accessible name).
    expect(dialog).toHaveAccessibleName("Confirm delete");
  });

  it("moves focus to the first focusable on open", async () => {
    render(<ModalHarness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("traps Tab at the end and Shift+Tab at the start", async () => {
    render(<ModalHarness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    await userEvent.tab();
    expect(first).toHaveFocus(); // wrapped forward

    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus(); // wrapped backward
  });

  it("does not steal focus back when the parent re-renders for an unrelated reason", async () => {
    // Harness that re-renders (new inline onClose each time) without touching `open`.
    function RerenderHarness() {
      const [open, setOpen] = useState(false);
      const [, setTick] = useState(0);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          <button onClick={() => setTick((t) => t + 1)}>Tick</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Confirm">
            <button>First</button>
            <button>Last</button>
          </Modal>
        </div>
      );
    }
    render(<RerenderHarness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));

    const last = screen.getByRole("button", { name: "Last" });
    last.focus();
    // fireEvent (not userEvent) bumps state without moving focus to the Tick button. If the
    // effect depended on the unstable onClose, this re-render would tear it down and refocus
    // First — the ref pattern keeps focus exactly where the user left it.
    fireEvent.click(screen.getByRole("button", { name: "Tick" }));

    expect(last).toHaveFocus();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(<ModalHarness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("Toast", () => {
  it("is a polite live region", () => {
    render(<Toast message="Saved" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Saved");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
