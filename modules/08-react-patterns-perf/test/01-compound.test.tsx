import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion } from "../solution/01-compound.js";

describe("Accordion (compound component)", () => {
  it("opens a section's body when its header is clicked", async () => {
    render(
      <Accordion>
        <Accordion.Header id="s1">Section 1</Accordion.Header>
        <Accordion.Body id="s1">Body 1</Accordion.Body>
        <Accordion.Header id="s2">Section 2</Accordion.Header>
        <Accordion.Body id="s2">Body 2</Accordion.Body>
      </Accordion>,
    );
    expect(screen.queryByText("Body 1")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Section 1" }));
    expect(screen.getByText("Body 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section 1" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.queryByText("Body 2")).not.toBeInTheDocument();
  });
});
