import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterableCardList } from "../solution/02-transitions.js";

const CARDS = ["apple", "apricot", "banana", "cherry", "grape"];

describe("FilterableCardList (useTransition)", () => {
  it("filters the list by the typed query, case-insensitively", async () => {
    render(<FilterableCardList cards={CARDS} />);
    const list = screen.getByRole("list", { name: "cards" });

    expect(within(list).getAllByRole("listitem")).toHaveLength(CARDS.length);

    await userEvent.type(screen.getByLabelText("Filter"), "AP");

    await waitFor(() =>
      expect(
        within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent),
      ).toEqual(["apple", "apricot", "grape"]),
    );
  });

  it("marks the list aria-busy while the search transition is in-flight, then clears it", async () => {
    // Controllable search: stays pending until we resolve it, so isPending is observable.
    let resolveSearch!: (rows: string[]) => void;
    const search = vi.fn(() => new Promise<string[]>((res) => (resolveSearch = res)));
    render(<FilterableCardList cards={CARDS} search={search} />);
    const list = screen.getByRole("list", { name: "cards" });

    await userEvent.type(screen.getByLabelText("Filter"), "a");

    // In-flight: the transition is pending → busy. (Regressing to a plain awaited
    // setState with no useTransition would never set aria-busy true here.)
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(search).toHaveBeenCalled();

    resolveSearch(["apple"]);

    await waitFor(() => expect(list).toHaveAttribute("aria-busy", "false"));
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["apple"]);
  });
});
