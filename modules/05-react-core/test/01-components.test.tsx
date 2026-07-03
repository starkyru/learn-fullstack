import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../solution/01-components.js";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge label="New" />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
  it("defaults to the neutral tone class", () => {
    render(<Badge label="x" />);
    expect(screen.getByText("x").className).toBe("badge badge-neutral");
  });
  it("applies the requested tone", () => {
    render(<Badge label="ok" tone="success" />);
    expect(screen.getByText("ok").className).toBe("badge badge-success");
  });
});
