import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState, Loading, SuspendingBoard } from "../solution/04-loading-error.js";

// Force-render trigger so the test can flush React's Suspense retry after the
// promise settles (jsdom doesn't schedule the ping itself). We still assert the
// real fallback → resolved transition for the SAME promise instance.
let forceRerender: () => void = () => {};
function Harness({ promise }: { promise: Promise<string> }) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  forceRerender = force;
  return <SuspendingBoard promise={promise} />;
}

describe("Loading", () => {
  it("renders a status-role fallback", () => {
    render(<Loading />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading…");
  });
});

describe("ErrorState", () => {
  it("shows the error message in an alert and calls reset when retried", () => {
    const reset = vi.fn();
    render(<ErrorState error={new Error("Board failed to load")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Board failed to load");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("SuspendingBoard (Suspense boundary)", () => {
  it("shows the Loading fallback while pending, then the resolved content", async () => {
    const promise = Promise.resolve("Sprint board");
    render(<Harness promise={promise} />);

    // Fallback first — the boundary is active while the promise is pending.
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByLabelText("card-panel")).not.toBeInTheDocument();

    await act(async () => {
      await promise;
    });
    act(() => forceRerender());

    expect(screen.getByLabelText("card-panel")).toHaveTextContent("Sprint board");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
