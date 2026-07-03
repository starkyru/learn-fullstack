import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "../solution/06-consume.js";

describe("Toolbar", () => {
  it("renders library Buttons inside a labelled toolbar", () => {
    render(<Toolbar onAdd={() => {}} onClear={() => {}} />);
    const toolbar = screen.getByRole("toolbar", { name: "Board actions" });
    expect(toolbar).toBeInTheDocument();
    // The primary Button carries the library's variant class → proves it consumes the primitive.
    expect(screen.getByRole("button", { name: "Add card" })).toHaveClass("bg-brand");
  });

  it("fires the wired callbacks", async () => {
    const onAdd = vi.fn();
    const onClear = vi.fn();
    render(<Toolbar onAdd={onAdd} onClear={onClear} />);

    await userEvent.click(screen.getByRole("button", { name: "Add card" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
