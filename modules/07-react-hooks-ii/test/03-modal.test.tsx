import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { Modal, type ModalHandle } from "../solution/03-modal.js";

function Harness() {
  const ref = useRef<ModalHandle>(null);
  return (
    <div>
      <button type="button" onClick={() => ref.current?.focus()}>
        focus modal
      </button>
      <Modal ref={ref}>hi</Modal>
    </div>
  );
}

describe("Modal (portal + imperative handle)", () => {
  it("renders into a portal and focuses the Close button on focus()", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<Harness />);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "focus modal" }));
    expect(close).toHaveFocus();
  });
});
