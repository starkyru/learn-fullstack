import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewCardForm } from "../solution/02-react-hook-form.js";

describe("NewCardForm (React Hook Form + zod + field array)", () => {
  it("blocks submit and shows the resolver's title error when empty", async () => {
    const onSubmit = vi.fn();
    render(<NewCardForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("appends and removes tag inputs via the field array", async () => {
    render(<NewCardForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Tag 1")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));
    expect(screen.getByLabelText("Tag 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove tag 2" }));
    expect(screen.queryByLabelText("Tag 2")).not.toBeInTheDocument();
  });

  it("submits the typed values once everything is valid", async () => {
    const onSubmit = vi.fn();
    render(<NewCardForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship it");
    await userEvent.type(screen.getByLabelText("Tag 1"), "urgent");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      title: "Ship it",
      tags: [{ value: "urgent" }],
    });
  });
});
