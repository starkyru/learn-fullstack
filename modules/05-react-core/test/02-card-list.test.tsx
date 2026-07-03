import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CardList } from "../solution/02-card-list.js";

describe("CardList", () => {
  it("adds a card on submit and clears the input", async () => {
    const user = userEvent.setup();
    render(<CardList />);
    await user.type(screen.getByLabelText("new card"), "Write tests");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByLabelText<HTMLInputElement>("new card").value).toBe("");
  });

  it("removes a card on its Remove button", async () => {
    const user = userEvent.setup();
    render(<CardList initial={[{ id: "a", title: "Todo A" }]} />);
    await user.click(screen.getByRole("button", { name: "Remove Todo A" }));
    expect(screen.queryByText("Todo A")).not.toBeInTheDocument();
  });
});
