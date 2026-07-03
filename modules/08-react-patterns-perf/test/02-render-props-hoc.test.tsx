import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Toggle, withDisabled } from "../solution/02-render-props-hoc.js";

describe("Toggle (render prop)", () => {
  it("drives its UI through the render function", async () => {
    render(
      <Toggle
        render={({ on, toggle }) => (
          <button type="button" onClick={toggle}>
            {on ? "ON" : "OFF"}
          </button>
        )}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("OFF");
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("ON");
  });
});

describe("withDisabled (HOC)", () => {
  it("injects disabled onto the wrapped component", () => {
    const Btn = (props: { label: string; disabled?: boolean }) => (
      <button disabled={props.disabled}>{props.label}</button>
    );
    const Disabled = withDisabled(Btn);
    render(<Disabled label="Save" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
