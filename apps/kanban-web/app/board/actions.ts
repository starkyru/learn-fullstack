"use server";

import { revalidateTag } from "next/cache";
import { boardStore } from "../../src/board/board-service.js";
import {
  createCardAction,
  type CreateCardResult,
} from "../../src/board/create-card-action.js";

/**
 * The thin `"use server"` wrapper: it binds the pure `createCardAction` logic to its real
 * boundaries — the `boardStore` repo and Next's `revalidateTag`. This is the only place the
 * concrete store and `next/cache` are wired; the logic itself (validation + persistence +
 * revalidation) is tested in isolation against fakes. Callable directly from a `<form action>`.
 */
export async function createCard(input: unknown): Promise<CreateCardResult> {
  return createCardAction(input, {
    repo: boardStore,
    revalidate: (tag: string) => revalidateTag(tag),
  });
}
