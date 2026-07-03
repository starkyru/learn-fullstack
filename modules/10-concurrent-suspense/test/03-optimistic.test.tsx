import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardAdder } from "../solution/03-optimistic.js";

const rows = (list: HTMLElement) =>
  within(list)
    .getAllByRole("listitem")
    .map((li) => li.textContent);

describe("CardAdder (useOptimistic)", () => {
  it("shows the card optimistically while the add is in-flight, then keeps it on success", async () => {
    let resolveAdd!: () => void;
    const addCard = vi.fn(() => new Promise<void>((res) => (resolveAdd = res)));
    render(<CardAdder initialCards={["seed"]} addCard={addCard} />);

    await userEvent.type(screen.getByLabelText("New card"), "Ship it");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    const list = screen.getByRole("list", { name: "cards" });
    // Optimistic: visible BEFORE the promise resolves. Removing addOptimistic would
    // leave only ["seed"] here — this is what makes the test discriminate the hook.
    expect(rows(list)).toEqual(["seed", "Ship it"]);
    expect(addCard).toHaveBeenCalledWith("Ship it");

    resolveAdd();
    // Committed exactly once (no double-add) after the promise settles.
    await waitFor(() => expect(rows(list)).toEqual(["seed", "Ship it"]));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rolls the optimistic card back and shows an error when the add fails", async () => {
    let rejectAdd!: (err: Error) => void;
    const addCard = vi.fn(() => new Promise<void>((_res, rej) => (rejectAdd = rej)));
    render(<CardAdder initialCards={["seed"]} addCard={addCard} />);

    await userEvent.type(screen.getByLabelText("New card"), "Ship it");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    const list = screen.getByRole("list", { name: "cards" });
    // Optimistically present while the add is pending...
    expect(rows(list)).toEqual(["seed", "Ship it"]);

    rejectAdd(new Error("network"));

    // ...then rolled back once it rejects, with an error surfaced.
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to add card");
    expect(rows(list)).toEqual(["seed"]);
  });
});
