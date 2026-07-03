import {
  LoginSchema,
  UserSchema,
  type LoginInput,
  type User,
} from "@learn-fullstack/shared";

/**
 * WORKED EXAMPLE — validate unknown input against the shared UserSchema. The parsed value
 * is fully typed as `User`; invalid input throws a ZodError.
 */
export function parseUser(input: unknown): User {
  return UserSchema.parse(input);
}

/**
 * YOUR TURN (analog) — validate a login payload against the shared LoginSchema and return
 * the typed `LoginInput`. Mirror parseUser. (Both ends of the app reuse this one schema.)
 */
export function parseLogin(_input: unknown): LoginInput {
  throw new Error("TODO: parse input with LoginSchema and return it");
}
