import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardForm, type FormState } from "../solution/02-card-form.js";

describe("CardForm (useActionState)", () => {
  it("submits the typed title's FormData to the action", async () => {
    let seen: FormData | null = null;
    const action = vi.fn(async (_prev: FormState, fd: FormData) => {
      seen = fd;
      return { status: "success", title: String(fd.get("title")) } as FormState;
    });
    render(<CardForm action={action} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship it");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(seen!.get("title")).toBe("Ship it");
  });

  it("shows a pending state while the action is in-flight", async () => {
    let resolve!: (s: FormState) => void;
    const action = vi.fn(() => new Promise<FormState>((res) => (resolve = res)));
    render(<CardForm action={action} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship it");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    // In-flight: button relabels to "Saving…" and is disabled.
    const pending = await screen.findByRole("button", { name: "Saving…" });
    expect(pending).toBeDisabled();

    resolve({ status: "success", title: "Ship it" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled(),
    );
  });

  it("renders the error text after a failed action", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({
      status: "error",
      error: "Title is required",
    }));
    render(<CardForm action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the success text after a successful action", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({
      status: "success",
      title: "Ship it",
    }));
    render(<CardForm action={action} />);

    await userEvent.type(screen.getByLabelText("Title"), "Ship it");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Created Ship it");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
