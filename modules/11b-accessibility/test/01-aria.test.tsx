import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleButton } from "../solution/01-aria.js";

describe("ToggleButton", () => {
  it("exposes aria-pressed reflecting the pressed prop", () => {
    render(<ToggleButton label="Bold" pressed={true} onToggle={() => {}} />);
    expect(
      screen.getByRole("button", { pressed: true, name: "Bold" }),
    ).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<ToggleButton label="Bold" pressed={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
