import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, Input, buttonStories, inputStories } from "../solution/01-primitives.js";

describe("Button", () => {
  it("maps each variant to its own class token", () => {
    const { rerender } = render(<Button variant="primary">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-brand", "text-brand-fg");

    rerender(<Button variant="ghost">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-transparent", "text-brand");
    expect(screen.getByRole("button")).not.toHaveClass("bg-brand");
  });

  it("merges a caller className without dropping the base classes", () => {
    render(<Button className="mt-4">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("rounded-xl", "mt-4");
  });

  it("renders every story from its args", () => {
    for (const story of Object.values(buttonStories)) {
      const { unmount } = render(story.render(story.args));
      expect(screen.getByRole("button")).toHaveTextContent(String(story.args.children));
      unmount();
    }
  });
});

describe("Input", () => {
  it("wires the label to the field via htmlFor/id", () => {
    render(<Input id="email" label="Email" />);
    // getByLabelText only resolves when label htmlFor matches the input id.
    expect(screen.getByLabelText("Email")).toBe(screen.getByRole("textbox"));
  });

  it("ships Empty and Filled stories that render an input", () => {
    expect(Object.keys(inputStories)).toEqual(
      expect.arrayContaining(["Empty", "Filled"]),
    );
    const filled = inputStories.Filled!;
    render(filled.render(filled.args));
    expect(screen.getByLabelText(filled.args.label)).toHaveValue("Draft");
  });
});
