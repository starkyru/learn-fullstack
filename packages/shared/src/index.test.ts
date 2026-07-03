import { describe, expect, it } from "vitest";
import { LoginSchema, UserSchema } from "./index.js";

describe("shared schemas", () => {
  it("accepts a valid user and infers the type", () => {
    const user = UserSchema.parse({ id: "u1", email: "a@b.com", name: null });
    expect(user.email).toBe("a@b.com");
    expect(user.name).toBeNull();
  });

  it("rejects a bad email", () => {
    expect(() => UserSchema.parse({ id: "u1", email: "nope", name: "x" })).toThrow();
  });

  it("LoginSchema enforces a minimum password length", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(
      false,
    );
  });
});
