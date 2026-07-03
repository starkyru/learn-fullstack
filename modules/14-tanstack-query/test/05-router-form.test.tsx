import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SurveyForm, cardRoute, defineRoute } from "../solution/05-router-form.js";
import type { CardParams } from "../solution/05-router-form.js";

describe("Task 5 — typed route descriptor", () => {
  it("parseParams turns the raw URL map into typed params (cardId is a number)", () => {
    const params = cardRoute.parseParams({ boardId: "b1", cardId: "42" });
    // Hand-written expected — cardId parsed to a number, not the "42" string.
    expect(params).toEqual({ boardId: "b1", cardId: 42 });
    const check: CardParams = params;
    expect(typeof check.cardId).toBe("number");
  });

  it("buildPath fills the $-segments from typed params", () => {
    expect(cardRoute.buildPath({ boardId: "b1", cardId: 42 })).toBe(
      "/boards/b1/cards/42",
    );
  });

  it("defineRoute is generic over arbitrary param shapes", () => {
    const userRoute = defineRoute<{ userId: string }>({
      path: "/users/$userId",
      parseParams: (raw) => ({ userId: raw["userId"] ?? "" }),
    });
    expect(userRoute.buildPath({ userId: "u7" })).toBe("/users/u7");
    expect(userRoute.parseParams({ userId: "u7" })).toEqual({ userId: "u7" });
  });
});

describe("Task 5 — survey form field validation", () => {
  it("shows the required error on submit when empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SurveyForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Handle is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the format error while typing a handle without a leading @", async () => {
    const user = userEvent.setup();
    render(<SurveyForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Handle"), "bob");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Handle must start with @",
    );
  });

  it("accepts a valid handle and submits the exact value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SurveyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Handle"), "@bob");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ handle: "@bob" }));
  });
});
