import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardBoard, type Card } from "../solution/03-optimistic-move.js";

// Each card renders a "Move {title}" button; collect the card titles in a column by
// reading those button labels (robust to the li holding both text and the button).
const titlesIn = (name: string) =>
  within(screen.getByRole("list", { name }))
    .queryAllByRole("button")
    .map((b) => (b.textContent ?? "").replace(/^Move /, ""));

const START: Card[] = [{ id: "c1", title: "Ship it", column: "todo" }];

describe("CardBoard (useOptimistic move)", () => {
  it("shows the card in its new column immediately, before the action settles", async () => {
    let resolveMove!: (cards: Card[]) => void;
    const moveCard = vi.fn(() => new Promise<Card[]>((res) => (resolveMove = res)));
    render(<CardBoard initialCards={START} moveCard={moveCard} />);

    await userEvent.click(screen.getByRole("button", { name: "Move Ship it" }));

    // Optimistic: already in "done" while moveCard is still pending. Without applyMove
    // the card would sit in "todo" until commit — this is what discriminates the hook.
    expect(titlesIn("done")).toContain("Ship it");
    expect(titlesIn("todo")).not.toContain("Ship it");
    expect(moveCard).toHaveBeenCalledWith("c1", "done");

    resolveMove([{ id: "c1", title: "Ship it", column: "done" }]);
    await waitFor(() => expect(titlesIn("done")).toContain("Ship it"));
  });

  it("moves a DONE card back to todo (direction is derived from the card's column)", async () => {
    // Server truth after a done→todo move. Mock auto-resolves so a failed assertion never
    // leaves a dangling transition to pollute the next test.
    const moveCard = vi.fn(async (): Promise<Card[]> => [
      { id: "c2", title: "Done deal", column: "todo" },
    ]);
    const started: Card[] = [{ id: "c2", title: "Done deal", column: "done" }];
    render(<CardBoard initialCards={started} moveCard={moveCard} />);

    await userEvent.click(screen.getByRole("button", { name: "Move Done deal" }));

    // A DONE card must move toward "todo" — a hardcoded "done" direction would call
    // moveCard("c2","done") and leave the card put.
    await waitFor(() => expect(moveCard).toHaveBeenCalledWith("c2", "todo"));
    expect(moveCard).not.toHaveBeenCalledWith("c2", "done");
    await waitFor(() => {
      expect(titlesIn("todo")).toEqual(["Done deal"]);
      expect(titlesIn("done")).toEqual([]);
    });
  });

  it("commits the server's authoritative list when the action settles", async () => {
    const moveCard = vi.fn(async (): Promise<Card[]> => [
      { id: "c1", title: "Ship it", column: "done" },
    ]);
    render(<CardBoard initialCards={START} moveCard={moveCard} />);

    await userEvent.click(screen.getByRole("button", { name: "Move Ship it" }));

    await waitFor(() => {
      expect(titlesIn("done")).toEqual(["Ship it"]);
      expect(titlesIn("todo")).toEqual([]);
    });
  });

  it("reconciles back when the server keeps the card put (optimistic rollback)", async () => {
    let resolveMove!: (cards: Card[]) => void;
    const moveCard = vi.fn(() => new Promise<Card[]>((res) => (resolveMove = res)));
    render(<CardBoard initialCards={START} moveCard={moveCard} />);

    await userEvent.click(screen.getByRole("button", { name: "Move Ship it" }));
    expect(titlesIn("done")).toContain("Ship it"); // optimistic

    // Server rejected the move: truth still has the card in "todo".
    resolveMove([{ id: "c1", title: "Ship it", column: "todo" }]);

    await waitFor(() => {
      expect(titlesIn("todo")).toEqual(["Ship it"]);
      expect(titlesIn("done")).toEqual([]);
    });
  });
});
