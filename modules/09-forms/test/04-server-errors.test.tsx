import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CardFormWithServer,
  ServerValidationError,
} from "../solution/04-server-errors.js";

describe("CardFormWithServer (async + server errors)", () => {
  it("maps a ServerValidationError onto the offending field and does not call onSuccess", async () => {
    const createCard = vi
      .fn()
      .mockRejectedValueOnce(new ServerValidationError({ title: "Title already taken" }));
    const onSuccess = vi.fn();
    render(<CardFormWithServer createCard={createCard} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Title"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Title already taken")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(createCard).toHaveBeenCalledWith({ title: "Roadmap" });
  });

  it("falls back to a form-level error when server errors map to no rendered field", async () => {
    // Unknown key + no known field → must not vanish silently.
    const createCard = vi
      .fn()
      .mockRejectedValueOnce(new ServerValidationError({ subtitle: "Not a real field" }));
    const onSuccess = vi.fn();
    render(<CardFormWithServer createCard={createCard} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Title"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText("Not a real field")).not.toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("shows a form-level error for a non-validation failure", async () => {
    const createCard = vi.fn().mockRejectedValueOnce(new Error("network down"));
    const onSuccess = vi.fn();
    render(<CardFormWithServer createCard={createCard} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Title"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onSuccess when the server accepts the card", async () => {
    const createCard = vi.fn().mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<CardFormWithServer createCard={createCard} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Title"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
