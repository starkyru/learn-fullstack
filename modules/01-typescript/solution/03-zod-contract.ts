import {
  LoginSchema,
  UserSchema,
  type LoginInput,
  type User,
} from "@learn-fullstack/shared";

export function parseUser(input: unknown): User {
  return UserSchema.parse(input);
}

export function parseLogin(input: unknown): LoginInput {
  return LoginSchema.parse(input);
}
