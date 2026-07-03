import { CreateCardInput, type BoardRepo, type Card } from "./board-service.js";

/**
 * Server Action CORE, testability-first (the pattern from module 25).
 *
 * A real `"use server"` function can't be unit tested — it needs the Next server + a live
 * request. So the LOGIC lives here as a plain async function whose true boundaries are
 * injected as `deps`: a `repo` (the database) and `revalidate` (Next's cache invalidation).
 * The thin `"use server"` wrapper in app/board/actions.ts binds the real repo + `revalidateTag`;
 * tests bind fakes.
 *
 * Contract: validate the input with zod; on failure return `{ ok: false, error }` (never throw —
 * the form must render the message); on success persist via the repo, invalidate the `"board"`
 * cache tag, and return `{ ok: true, card }`. Order matters: validate → persist → revalidate →
 * return, so a rejected input never writes and never busts the cache.
 */

export interface CreateCardDeps {
  repo: Pick<BoardRepo, "createCard">;
  revalidate: (tag: string) => void;
}

export type CreateCardResult = { ok: true; card: Card } | { ok: false; error: string };

export const BOARD_CACHE_TAG = "board";

export async function createCardAction(
  input: unknown,
  deps: CreateCardDeps,
): Promise<CreateCardResult> {
  const parsed = CreateCardInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid input" };
  }
  const card = await deps.repo.createCard(parsed.data);
  deps.revalidate(BOARD_CACHE_TAG);
  return { ok: true, card };
}
