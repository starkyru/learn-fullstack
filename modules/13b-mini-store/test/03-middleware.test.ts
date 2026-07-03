import { describe, expect, it, vi } from "vitest";
import { createStore, type StateCreator } from "../solution/01-create-store.js";
import {
  createMemoryStorage,
  devtools,
  persist,
  type DevtoolsEntry,
} from "../solution/03-middleware.js";

interface Counter {
  count: number;
  inc: () => void;
}

const counterInit: StateCreator<Counter> = (set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
});

describe("persist", () => {
  it("writes JSON to storage after each set", () => {
    const storage = createMemoryStorage();
    const store = createStore(persist(counterInit, { name: "c", storage }));

    store.getState().inc();
    expect(JSON.parse(storage.getItem("c") ?? "null")).toEqual({ count: 1 });
  });

  it("rehydrates the initial state from storage, keeping actions", () => {
    const storage = createMemoryStorage();
    storage.setItem("c", JSON.stringify({ count: 42 }));

    const store = createStore(persist(counterInit, { name: "c", storage }));
    expect(store.getState().count).toBe(42); // rehydrated
    expect(typeof store.getState().inc).toBe("function"); // action survived the merge

    store.getState().inc();
    expect(store.getState().count).toBe(43); // continues from rehydrated value
  });

  it("ignores a corrupt saved payload and falls back to defaults", () => {
    const storage = createMemoryStorage();
    storage.setItem("c", "{not valid json");

    const store = createStore(persist(counterInit, { name: "c", storage }));
    expect(store.getState().count).toBe(0);
  });
});

describe("devtools", () => {
  it("logs the post-set state to the injected logger on each set", () => {
    const entries: DevtoolsEntry[] = [];
    const logger = vi.fn((entry: DevtoolsEntry) => entries.push(entry));
    const store = createStore(devtools(counterInit, { name: "counter", logger }));

    store.getState().inc();
    store.getState().inc();

    expect(logger).toHaveBeenCalledTimes(2);
    expect(entries[1]).toEqual({
      name: "counter",
      state: expect.objectContaining({ count: 2 }),
    });
  });
});

describe("composition", () => {
  it("persist(devtools(...)) both logs and persists on a set", () => {
    const storage = createMemoryStorage();
    const logger = vi.fn();
    const store = createStore(
      persist(devtools(counterInit, { name: "counter", logger }), { name: "c", storage }),
    );

    store.getState().inc();

    expect(logger).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem("c") ?? "null")).toEqual({ count: 1 });
  });
});
