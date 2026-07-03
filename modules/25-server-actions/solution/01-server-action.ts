import { z } from "zod";

/**
 * Server Action CORE, testability-first. A real "use server" function can't be unit
 * tested (it needs the Next server + a request), so we write the LOGIC as a plain
 * async function that takes its true boundaries as injected `deps`: a `repo` (the
 * database) and `revalidate` (Next's cache invalidation). A thin `"use server"`
 * wrapper in the app binds the real repo + `revalidateTag`; tests bind fakes.
 *
 * The contract: validate the input with zod; on failure return `{ ok: false, error }`
 * (never throw — the form needs to render the message); on success persist via the
 * repo, invalidate the `"cards"` cache tag, and return `{ ok: true, card }`.
 */

export type Card = { id: string; title: string; boardId: string };

export type CardRepo = {
  create(input: { title: string; boardId: string }): Promise<Card>;
  rename(id: string, title: string): Promise<Card>;
};

export type ActionDeps = {
  repo: CardRepo;
  revalidate: (tag: string) => void;
};

export type ActionResult = { ok: true; card: Card } | { ok: false; error: string };

const CreateCardInput = z.object({
  title: z.string().min(1, "Title is required"),
  boardId: z.string().min(1, "Board is required"),
});

const RenameCardInput = z.object({
  id: z.string().min(1, "Card id is required"),
  title: z.string().min(1, "Title is required"),
});

/**
 * WORKED EXAMPLE — create a card. Note the order: validate → persist → revalidate →
 * return. We only touch the repo and invalidate the cache once the input is known
 * good, so a rejected input never writes and never busts the cache.
 */
export async function createCardAction(
  input: unknown,
  deps: ActionDeps,
): Promise<ActionResult> {
  const parsed = CreateCardInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid input" };
  }
  const card = await deps.repo.create(parsed.data);
  deps.revalidate("cards");
  return { ok: true, card };
}

/**
 * ANALOG (learner builds this in src/) — same shape, renaming an existing card:
 * validate `{ id, title }`, `repo.rename(id, title)`, `revalidate("cards")`, return
 * `{ ok, card }`.
 */
export async function renameCardAction(
  input: unknown,
  deps: ActionDeps,
): Promise<ActionResult> {
  const parsed = RenameCardInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid input" };
  }
  const card = await deps.repo.rename(parsed.data.id, parsed.data.title);
  deps.revalidate("cards");
  return { ok: true, card };
}
