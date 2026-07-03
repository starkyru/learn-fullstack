import { describe, expect, it, vi } from "vitest";
import { createStore, type StoreApi } from "../solution/01-create-store.js";

interface Counter {
  count: number;
  inc: () => void;
  add: (n: number) => void;
}

function makeCounter(): StoreApi<Counter> {
  return createStore<Counter>((set, get) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
    add: (n) => set({ count: get().count + n }),
  }));
}

describe("createStore", () => {
  it("exposes initial state and runs actions (object + functional set, reading via get)", () => {
    const store = makeCounter();
    expect(store.getState().count).toBe(0);

    store.getState().inc();
    expect(store.getState().count).toBe(1);

    store.getState().add(5);
    expect(store.getState().count).toBe(6);
  });

  it("shallow-merges: a partial set keeps the other keys (actions survive)", () => {
    const store = makeCounter();
    const incBefore = store.getState().inc;
    store.setState({ count: 9 });
    expect(store.getState().count).toBe(9);
    expect(store.getState().inc).toBe(incBefore); // merge, not overwrite
  });

  it("replace=true swaps the whole state instead of merging", () => {
    const store = makeCounter();
    store.setState({ count: 3 } as unknown as Counter, true);
    expect(store.getState().count).toBe(3);
    expect((store.getState() as Partial<Counter>).inc).toBeUndefined(); // keys dropped
  });

  it("notifies subscribers with (next, prev) and stops after unsubscribe", () => {
    const store = makeCounter();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 0 }),
    );

    unsubscribe();
    store.getState().inc();
    expect(listener).toHaveBeenCalledTimes(1); // no further notifications
  });

  it("skips the notify when replace re-sets the identical state ref", () => {
    const store = makeCounter();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(store.getState(), true); // same ref → Object.is short-circuit
    expect(listener).not.toHaveBeenCalled();
  });
});
