import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button.js";

describe("Button", () => {
  it("renders its children and applies the primary variant class by default", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-brand");
  });

  it("applies the requested variant", () => {
    render(<Button variant="ghost">Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" }).className).toContain(
      "text-brand",
    );
  });
});
