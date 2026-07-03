import { describe, expect, it, vi } from "vitest";
import {
  createCardAction,
  renameCardAction,
  type Card,
  type CardRepo,
} from "../solution/01-server-action.js";

// A fixed card the fake repo returns — id comes from the repo (the DB), never from
// Date.now/Math.random, so the action stays deterministic.
const CREATED: Card = { id: "c1", title: "Ship it", boardId: "b1" };
const RENAMED: Card = { id: "c1", title: "Ship it now", boardId: "b1" };

function fakes() {
  const repo: CardRepo = {
    create: vi.fn(async () => CREATED),
    rename: vi.fn(async () => RENAMED),
  };
  const revalidate = vi.fn();
  return { repo, revalidate };
}

describe("createCardAction", () => {
  it("validates, persists, revalidates the 'cards' tag, and returns the created card", async () => {
    const { repo, revalidate } = fakes();

    const res = await createCardAction(
      { title: "Ship it", boardId: "b1" },
      { repo, revalidate },
    );

    expect(repo.create).toHaveBeenCalledWith({ title: "Ship it", boardId: "b1" });
    expect(revalidate).toHaveBeenCalledWith("cards");
    expect(res).toEqual({ ok: true, card: CREATED });
  });

  it("rejects a zod-invalid input without touching the repo or the cache", async () => {
    const { repo, revalidate } = fakes();

    const res = await createCardAction(
      { title: "", boardId: "b1" },
      { repo, revalidate },
    );

    expect(res).toEqual({ ok: false, error: "Title is required" });
    expect(repo.create).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});

describe("renameCardAction (analog)", () => {
  it("validates, renames via the repo, revalidates, and returns the updated card", async () => {
    const { repo, revalidate } = fakes();

    const res = await renameCardAction(
      { id: "c1", title: "Ship it now" },
      { repo, revalidate },
    );

    expect(repo.rename).toHaveBeenCalledWith("c1", "Ship it now");
    expect(revalidate).toHaveBeenCalledWith("cards");
    expect(res).toEqual({ ok: true, card: RENAMED });
  });

  it("rejects an empty title without renaming or busting the cache", async () => {
    const { repo, revalidate } = fakes();

    const res = await renameCardAction({ id: "c1", title: "" }, { repo, revalidate });

    expect(res).toEqual({ ok: false, error: "Title is required" });
    expect(repo.rename).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
