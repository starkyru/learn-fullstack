import { describe, expect, it } from "vitest";
import type { Transport } from "../solution/02-deliver.js";
import {
  deadLetters,
  replay,
  type DeliveryStore,
  type StoredDelivery,
} from "../solution/04-replay.js";

const constantTransport =
  (status: number): Transport =>
  async () => ({ status });

function storeOf(records: StoredDelivery[]): DeliveryStore {
  return new Map(records.map((r) => [r.id, r]));
}

const base: Omit<StoredDelivery, "attempts" | "status"> = {
  id: "d1",
  url: "https://p/hook",
  body: "{}",
  maxAttempts: 3,
};

describe("replay", () => {
  it("marks a delivery success on a 2xx and bumps attempts", async () => {
    const store = storeOf([{ ...base, attempts: 0, status: "failed" }]);
    const updated = await replay("d1", store, constantTransport(200));
    expect(updated).toEqual({ ...base, attempts: 1, status: "success" });
    expect(store.get("d1")).toEqual(updated); // written back
  });

  it("stays 'failed' when a retry fails but attempts remain", async () => {
    const store = storeOf([{ ...base, attempts: 0, status: "pending" }]);
    const updated = await replay("d1", store, constantTransport(500));
    expect(updated.status).toBe("failed");
    expect(updated.attempts).toBe(1);
  });

  it("moves to the DLQ ('dead') when the failing attempt exhausts maxAttempts", async () => {
    const store = storeOf([{ ...base, attempts: 2, status: "failed" }]);
    const updated = await replay("d1", store, constantTransport(500));
    expect(updated).toEqual({ ...base, attempts: 3, status: "dead" });
    expect(deadLetters(store)).toEqual([updated]);
  });

  it("treats a thrown transport as a failed attempt", async () => {
    const store = storeOf([{ ...base, attempts: 2, status: "failed" }]);
    const throwing: Transport = async () => {
      throw new Error("NET");
    };
    const updated = await replay("d1", store, throwing);
    expect(updated.status).toBe("dead");
    expect(updated.attempts).toBe(3);
  });

  it("throws on an unknown id", async () => {
    const store = storeOf([{ ...base, attempts: 0, status: "pending" }]);
    await expect(replay("nope", store, constantTransport(200))).rejects.toThrow(
      "Unknown delivery: nope",
    );
  });
});

describe("deadLetters", () => {
  it("returns only the dead records", () => {
    const store = storeOf([
      { ...base, id: "a", attempts: 1, status: "success" },
      { ...base, id: "b", attempts: 3, status: "dead" },
      { ...base, id: "c", attempts: 3, status: "dead" },
    ]);
    expect(deadLetters(store).map((d) => d.id)).toEqual(["b", "c"]);
  });
});
