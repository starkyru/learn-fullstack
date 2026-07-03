"use client";

import { useState } from "react";
import type { ReactElement } from "react";

export interface Column {
  id: string;
  title: string;
  cards: string[];
}

export interface Board {
  columns: Column[];
}

/**
 * The one interactive island. Marked `"use client"` (the directive at the top of
 * this module) so it ships JS to the browser and can hold state. It toggles
 * between a trigger button and an inline "new card" form — the only part of the
 * board that needs a client bundle.
 */
export function AddCardButton(): ReactElement {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Add card
      </button>
    );
  }
  return (
    <form aria-label="new-card-form">
      <label htmlFor="new-card">New card</label>
      <input id="new-card" name="title" />
      <button type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}

/**
 * The board itself is a Server Component: an `async` function that renders the
 * columns and cards as static host elements — no event handlers, no client JS.
 * It *includes* the `<AddCardButton>` island for interactivity but doesn't own
 * any of its behavior. Awaiting it returns the element tree so a test can prove
 * the server part carries no `onClick`.
 */
export async function BoardView({ board }: { board: Board }): Promise<ReactElement> {
  return (
    <section aria-label="board">
      {board.columns.map((col) => (
        <div key={col.id} className="column" data-column={col.id}>
          <h2>{col.title}</h2>
          <ul aria-label={`cards-${col.id}`}>
            {col.cards.map((card, i) => (
              <li key={`${col.id}-${i}`}>{card}</li>
            ))}
          </ul>
        </div>
      ))}
      <AddCardButton />
    </section>
  );
}
