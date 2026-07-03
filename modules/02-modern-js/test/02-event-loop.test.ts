import { describe, expect, it } from "vitest";
import { orderedEffects } from "../solution/02-event-loop.js";

describe("orderedEffects", () => {
  it("emits sync, then microtask, then macrotask", async () => {
    await expect(orderedEffects()).resolves.toEqual(["sync", "microtask", "macrotask"]);
  });
});
