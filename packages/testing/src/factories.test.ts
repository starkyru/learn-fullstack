import { describe, expect, it } from "vitest";
import { UserSchema } from "@learn-fullstack/shared";
import { makeUser } from "./factories.js";

describe("makeUser", () => {
  it("produces a User that satisfies the shared UserSchema", () => {
    const user = makeUser();
    expect(() => UserSchema.parse(user)).not.toThrow();
  });

  it("applies overrides", () => {
    expect(makeUser({ name: "Ada" }).name).toBe("Ada");
  });

  it("gives each user a distinct id", () => {
    expect(makeUser().id).not.toEqual(makeUser().id);
  });
});
