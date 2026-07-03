import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useThemeSetter, useThemeState } from "../solution/02-context.js";

function StateConsumer({ onRender }: { onRender: () => void }) {
  onRender();
  return <span data-testid="theme">{useThemeState()}</span>;
}
function SetterConsumer({ onRender }: { onRender: () => void }) {
  onRender();
  const setTheme = useThemeSetter();
  return (
    <button type="button" onClick={() => setTheme("dark")}>
      go dark
    </button>
  );
}

describe("split-context ThemeProvider (minimizing re-renders)", () => {
  it("re-renders the state consumer but NOT the setter-only consumer on theme change", async () => {
    let stateRenders = 0;
    let setterRenders = 0;
    render(
      <ThemeProvider>
        <StateConsumer onRender={() => stateRenders++} />
        <SetterConsumer onRender={() => setterRenders++} />
      </ThemeProvider>,
    );
    expect(stateRenders).toBe(1);
    expect(setterRenders).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: "go dark" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(stateRenders).toBe(2); // theme value changed → re-rendered
    expect(setterRenders).toBe(1); // setter is stable → NOT re-rendered
  });
});
