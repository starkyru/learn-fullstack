import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CardsTable, UsersTable } from "../solution/04-tanstack-table.js";
import type { CardRow, User } from "../solution/04-tanstack-table.js";

const USERS: User[] = [
  { id: "u1", name: "Charlie", age: 30 },
  { id: "u2", name: "Alice", age: 42 },
  { id: "u3", name: "Bob", age: 5 },
];

/** Names in body-row order (skip the header row). */
function bodyNames(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelector("td")?.textContent ?? "");
}

describe("Task 4 — UsersTable sorting", () => {
  it("renders in source order until a header is clicked", () => {
    render(<UsersTable users={USERS} />);
    expect(bodyNames()).toEqual(["Charlie", "Alice", "Bob"]);
  });

  it("click on Name sorts ascending, second click sorts descending", async () => {
    const user = userEvent.setup();
    render(<UsersTable users={USERS} />);

    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(bodyNames()).toEqual(["Alice", "Bob", "Charlie"]);

    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(bodyNames()).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("sorts numerically by Age, not lexicographically", async () => {
    const user = userEvent.setup();
    render(<UsersTable users={USERS} />);

    await user.click(screen.getByRole("button", { name: "Age" }));
    // Numeric 5 < 30 < 42 → Bob, Charlie, Alice. Lexicographic on "5"/"30"/"42" would give
    // Charlie, Alice, Bob — so this order proves the sort is numeric, not string.
    expect(bodyNames()).toEqual(["Bob", "Charlie", "Alice"]);
  });
});

const CARDS: CardRow[] = [
  { id: "c1", title: "Gamma", priority: 2 },
  { id: "c2", title: "Alpha", priority: 10 },
  { id: "c3", title: "Beta", priority: 1 },
];

function bodyTitles(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.querySelector("td")?.textContent ?? "");
}

describe("Task 4 — CardsTable (analog)", () => {
  it("click on Title sorts card rows alphabetically", async () => {
    const user = userEvent.setup();
    render(<CardsTable cards={CARDS} />);
    expect(bodyTitles()).toEqual(["Gamma", "Alpha", "Beta"]);

    await user.click(screen.getByRole("button", { name: "Title" }));
    expect(bodyTitles()).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("click on Priority sorts numerically (10 is not less than 2)", async () => {
    const user = userEvent.setup();
    render(<CardsTable cards={CARDS} />);

    await user.click(screen.getByRole("button", { name: "Priority" }));
    // ascending priority 1,2,10 → Beta, Gamma, Alpha
    expect(bodyTitles()).toEqual(["Beta", "Gamma", "Alpha"]);
  });
});
