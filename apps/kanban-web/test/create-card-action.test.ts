import { describe, expect, it, vi } from "vitest";
import {
  createCardAction,
  type CreateCardDeps,
} from "../src/board/create-card-action.js";
import type { Card } from "../src/board/board-service.js";

// A fixed card the fake repo returns — the id comes from the repo (the DB), never from
// Date.now/Math.random, so the action stays deterministic.
const CREATED: Card = { id: "c9", title: "Ship it", columnId: "todo" };

function fakes(): { repo: CreateCardDeps["repo"]; revalidate: ReturnType<typeof vi.fn> } {
  const repo = { createCard: vi.fn(async () => CREATED) };
  const revalidate = vi.fn();
  return { repo, revalidate };
}

describe("createCardAction", () => {
  it("validates, persists via repo.createCard, revalidates the 'board' tag, and returns the card", async () => {
    const { repo, revalidate } = fakes();

    const res = await createCardAction(
      { boardId: "b1", columnId: "todo", title: "Ship it" },
      { repo, revalidate },
    );

    expect(repo.createCard).toHaveBeenCalledWith({
      boardId: "b1",
      columnId: "todo",
      title: "Ship it",
    });
    expect(revalidate).toHaveBeenCalledWith("board");
    expect(res).toEqual({ ok: true, card: CREATED });
  });

  it("rejects an empty title without touching the repo or busting the cache", async () => {
    const { repo, revalidate } = fakes();

    const res = await createCardAction(
      { boardId: "b1", columnId: "todo", title: "" },
      { repo, revalidate },
    );

    expect(res).toEqual({ ok: false, error: "Title is required" });
    expect(repo.createCard).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("rejects a missing boardId with the field's message", async () => {
    const { repo, revalidate } = fakes();

    const res = await createCardAction(
      { columnId: "todo", title: "Ship it" },
      { repo, revalidate },
    );

    expect(res).toEqual({ ok: false, error: "Board is required" });
    expect(repo.createCard).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
