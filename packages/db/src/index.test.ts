import { describe, expect, it } from "vitest";
import { db } from "./index.js";

// A pure smoke test — does NOT hit a database (no connection is opened until a query runs).
describe("db client", () => {
  it("exposes the shared PrismaClient with the User model", () => {
    expect(db).toBeDefined();
    expect(db.user).toBeDefined();
  });
});
