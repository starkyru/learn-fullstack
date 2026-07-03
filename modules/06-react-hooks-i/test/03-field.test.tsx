import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "../solution/03-field.js";

describe("Field", () => {
  it("links the label to the input via a matching id", () => {
    render(<Field label="Email" value="" onChange={() => {}} />);
    const input = screen.getByLabelText("Email");
    const label = screen.getByText("Email");
    expect(input.id).toBeTruthy();
    expect(label.getAttribute("for")).toBe(input.id);
  });
});
