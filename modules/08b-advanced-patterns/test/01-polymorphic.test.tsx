import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box, Text } from "../solution/01-polymorphic.js";

describe("Box polymorphic", () => {
  it("renders a div by default and keeps its children", () => {
    const { container } = render(<Box data-testid="b">hi</Box>);
    const el = container.firstElementChild;
    expect(el?.tagName).toBe("DIV");
    expect(el?.textContent).toBe("hi");
  });

  it("renders as an anchor and spreads href", () => {
    const { container } = render(
      <Box as="a" href="https://example.com/x">
        link
      </Box>,
    );
    const el = container.firstElementChild as HTMLAnchorElement;
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("https://example.com/x");
  });

  it("renders as a button and forwards type + disabled", () => {
    const { container } = render(
      <Box as="button" type="submit" disabled>
        go
      </Box>,
    );
    const el = container.firstElementChild as HTMLButtonElement;
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("submit");
    expect(el.disabled).toBe(true);
  });
});

describe("Text polymorphic", () => {
  it("renders a span by default", () => {
    const { container } = render(<Text>hello</Text>);
    const el = container.firstElementChild;
    expect(el?.tagName).toBe("SPAN");
    expect(el?.textContent).toBe("hello");
  });

  it("renders as a label and forwards htmlFor", () => {
    const { container } = render(<Text as="label" htmlFor="email" />);
    const el = container.firstElementChild as HTMLLabelElement;
    expect(el.tagName).toBe("LABEL");
    expect(el.getAttribute("for")).toBe("email");
  });

  it("renders as an anchor and spreads href", () => {
    const { container } = render(
      <Text as="a" href="https://example.com/y">
        y
      </Text>,
    );
    const el = container.firstElementChild as HTMLAnchorElement;
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("https://example.com/y");
  });
});
