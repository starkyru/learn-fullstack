import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Parent } from "../solution/04-memo.js";

describe("memoization (minimizing re-renders)", () => {
  it("does not re-render the memoized child when unrelated parent state changes", async () => {
    let childRenders = 0;
    render(<Parent onChildRender={() => childRenders++} />);
    expect(childRenders).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "bump" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(childRenders).toBe(1); // memo + stable callback → child did NOT re-render
  });
});
