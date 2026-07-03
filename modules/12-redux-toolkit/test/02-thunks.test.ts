import { describe, expect, it, vi } from "vitest";
import type { Card } from "../solution/01-slices.js";
import { loadBoard, makeAsyncBoardStore, type BoardApi } from "../solution/02-thunks.js";

const CARDS: Card[] = [
  { id: "1", title: "Ship", columnId: "todo" },
  { id: "2", title: "Review", columnId: "doing" },
];

describe("loadBoard thunk", () => {
  it("starts idle, flips to loading, then succeeded with the fetched cards", async () => {
    let resolveFetch!: (cards: Card[]) => void;
    const api: BoardApi = {
      fetchBoard: vi.fn(() => new Promise<Card[]>((res) => (resolveFetch = res))),
    };
    const store = makeAsyncBoardStore(api);

    expect(store.getState().asyncBoard.status).toBe("idle");

    const promise = store.dispatch(loadBoard("board-1"));
    // pending has dispatched synchronously.
    expect(store.getState().asyncBoard.status).toBe("loading");
    expect(api.fetchBoard).toHaveBeenCalledWith("board-1");

    resolveFetch(CARDS);
    await promise;

    const state = store.getState().asyncBoard;
    expect(state.status).toBe("succeeded");
    expect(state.cards).toEqual(CARDS);
    expect(state.error).toBeNull();
  });

  it("flips to failed and records the error message on rejection", async () => {
    const api: BoardApi = {
      fetchBoard: vi.fn(() => Promise.reject(new Error("network down"))),
    };
    const store = makeAsyncBoardStore(api);

    await store.dispatch(loadBoard("board-1"));

    const state = store.getState().asyncBoard;
    expect(state.status).toBe("failed");
    expect(state.error).toBe("network down");
    expect(state.cards).toEqual([]);
  });

  it("uses the generic fallback when the rejection carries no message", async () => {
    // Rejecting with a message-less value → SerializedError has undefined `message`,
    // so the `?? "Unknown error"` fallback must fill in. Rejecting with a real Error
    // (which always has a message) would never exercise this branch.
    const api: BoardApi = { fetchBoard: vi.fn(() => Promise.reject({})) };
    const store = makeAsyncBoardStore(api);

    await store.dispatch(loadBoard("board-1"));

    expect(store.getState().asyncBoard.error).toBe("Unknown error");
  });
});
