import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { List } from "../solution/04-perf.js";

describe("perf pass (memoized rows)", () => {
  it("re-renders only the toggled row, not its siblings", async () => {
    const renders: Record<string, number> = {};
    render(<List onRowRender={(id) => (renders[id] = (renders[id] ?? 0) + 1)} />);
    expect(renders).toEqual({ a: 1, b: 1, c: 1 });

    await userEvent.click(screen.getByRole("button", { name: "toggle a" }));
    expect(renders.a).toBe(2); // its `done` changed → re-rendered
    expect(renders.b).toBe(1); // unchanged → memo skipped it
    expect(renders.c).toBe(1);
  });
});
