import type { User } from "@learn-fullstack/shared";

let seq = 0;

/** Deterministic-ish test fixtures. faker-based factories land in module 26. */
export function makeUser(overrides: Partial<User> = {}): User {
  seq += 1;
  return {
    id: `u${seq}`,
    email: `user${seq}@example.com`,
    name: `User ${seq}`,
    ...overrides,
  };
}
