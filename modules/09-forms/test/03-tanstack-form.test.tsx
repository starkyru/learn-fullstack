import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TanStackCardForm } from "../solution/03-tanstack-form.js";

describe("TanStackCardForm (TanStack Form)", () => {
  it("blocks submit and shows validators' messages when empty", async () => {
    const onSubmit = vi.fn();
    render(<TanStackCardForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(await screen.findByText("Tag can't be empty")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the typed values once both fields validate", async () => {
    const onSubmit = vi.fn();
    render(<TanStackCardForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship it");
    await userEvent.type(screen.getByLabelText("Tag"), "urgent");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ title: "Ship it", tag: "urgent" });
  });
});
