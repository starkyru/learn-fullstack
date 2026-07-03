"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Button } from "@learn-fullstack/ui";

/**
 * The one interactive island. Marked `"use client"` so it ships JS to the browser and can
 * hold state. It toggles between a trigger button and an inline "new card" form — the only
 * part of a column that needs a client bundle. Reuses the shared `<Button>` from
 * `@learn-fullstack/ui`.
 *
 * M2 wires the form's `onSubmit` to the `createCard` Server Action (see app/board/actions.ts);
 * for this M0 slice it is purely a controlled open/close toggle.
 */
export function AddCardButton({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}): ReactElement {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Add card
      </Button>
    );
  }

  return (
    <form aria-label={`new-card-${columnId}`} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="columnId" value={columnId} />
      <label htmlFor={`title-${columnId}`} className="text-xs text-gray-600">
        New card
      </label>
      <input
        id={`title-${columnId}`}
        name="title"
        className="rounded-xl border px-2 py-1 text-sm"
      />
      <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
