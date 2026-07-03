import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

const valid = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://dev:dev@localhost:5432/db",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  JWT_SECRET: "0123456789abcdef0123456789abcdef",
} satisfies NodeJS.ProcessEnv;

describe("loadEnv", () => {
  it("parses a valid environment and applies the NODE_ENV default", () => {
    const env = loadEnv({ ...valid, NODE_ENV: undefined });
    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("throws a readable error naming the missing variable", () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("rejects a too-short secret", () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
  });
});
