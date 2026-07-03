import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignupForm, signupSchema } from "../solution/01-controlled.js";

describe("SignupForm (controlled + zod)", () => {
  it("blocks submit and shows per-field messages for invalid input", async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("reports mismatched passwords on the confirm field, then submits when matched", async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "password124");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Passwords must match")).toBeInTheDocument();

    // Fix the confirm field and resubmit.
    await userEvent.clear(screen.getByLabelText("Confirm password"));
    await userEvent.type(screen.getByLabelText("Confirm password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "password123",
      confirmPassword: "password123",
    });
  });

  it("signupSchema rejects a mismatch on the confirmPassword path", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      confirmPassword: "nope12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});
