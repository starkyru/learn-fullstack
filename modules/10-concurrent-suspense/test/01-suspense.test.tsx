import { act, render, screen } from "@testing-library/react";
import { Suspense, useReducer, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary, UserName } from "../solution/01-suspense.js";

// Harness: a force-render trigger lets the test flush React's Suspense retry after
// the promise settles (jsdom doesn't schedule the ping on its own). We still assert
// the real fallback → resolved transition for the SAME promise instance.
let forceRerender: () => void = () => {};
function Harness({
  promise,
  boundary,
}: {
  promise: Promise<string>;
  boundary?: boolean;
}) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  forceRerender = force;
  const tree: ReactNode = (
    <Suspense fallback={<p>Loading…</p>}>
      <UserName promise={promise} />
    </Suspense>
  );
  return boundary ? (
    <ErrorBoundary fallback={<p>Something broke</p>}>{tree}</ErrorBoundary>
  ) : (
    tree
  );
}

describe("UserName + ErrorBoundary (Suspense / use())", () => {
  it("shows the Suspense fallback while pending, then the resolved name", async () => {
    const promise = Promise.resolve("Ada");
    render(<Harness promise={promise} />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await act(async () => {
      await promise;
    });
    act(() => forceRerender());

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("routes a rejected promise to the error boundary", async () => {
    const promise = Promise.reject(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Harness promise={promise} boundary />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await act(async () => {
      await promise.catch(() => {});
    });
    act(() => forceRerender());

    expect(screen.getByText("Something broke")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
