"use client";

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
 * YOUR TURN — split the board into a Server Component and a client island.
 *
 * 1. `AddCardButton` is the ONLY interactive bit. Keep the `"use client"`
 *    directive at the top of this file so it can hold state. With `useState`,
 *    toggle between:
 *      - closed: `<button type="button" onClick={() => setOpen(true)}>Add card</button>`
 *      - open:   a `<form aria-label="new-card-form">` with a `<label htmlFor="new-card">
 *        New card</label>`, `<input id="new-card" name="title" />`, and a
 *        `<button type="button" onClick={() => setOpen(false)}>Cancel</button>`.
 *
 * 2. `BoardView` is an `async` Server Component. Render
 *    `<section aria-label="board">` containing, for each column, a
 *    `<div className="column" data-column={col.id}>` with an `<h2>{col.title}</h2>`
 *    and a `<ul aria-label={\`cards-${col.id}\`}>` of `<li>` cards. Include a single
 *    `<AddCardButton />` at the end. The server part must carry NO `onClick`.
 */
export function AddCardButton(): ReactElement {
  throw new Error("TODO: client island that toggles an inline new-card form");
}

export async function BoardView(_props: { board: Board }): Promise<ReactElement> {
  throw new Error(
    "TODO: server-render the board, delegate interactivity to AddCardButton",
  );
}
