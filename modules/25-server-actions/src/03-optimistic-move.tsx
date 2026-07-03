"use client";

import { useOptimistic, useState, useTransition } from "react";

/**
 * YOUR TURN — build a <CardBoard> with an optimistic card move across two columns
 * ("todo" / "done") that reconciles to server truth when the action settles. Hint-only:
 *
 * 1. Hold the committed board in `useState(initialCards)`.
 * 2. `const [optimisticCards, applyMove] = useOptimistic(cards, (state, move) =>
 *    state.map(c => c.id === move.id ? { ...c, column: move.to } : c))`.
 * 3. `const [, startTransition] = useTransition()` — `applyMove` must run inside a
 *    transition (or action) for the optimistic value to show.
 * 4. `move(id, to)`: `startTransition(async () => { applyMove({ id, to });
 *    const settled = await moveCard(id, to); setCards(settled); })`. Committing the
 *    list the action returns is the "revalidate on settle" step — if the server keeps
 *    the card put, the optimistic move rolls back for free.
 * 5. Render a `<ul aria-label="todo">` and `<ul aria-label="done">` from
 *    `optimisticCards`; each `<li>` has the title + a `<button>Move {title}</button>`
 *    that moves the card to the OTHER column.
 */

export type Column = "todo" | "done";
export type Card = { id: string; title: string; column: Column };

export type MoveCard = (id: string, to: Column) => Promise<Card[]>;

export function CardBoard(_props: { initialCards: Card[]; moveCard: MoveCard }) {
  void useOptimistic;
  void useState;
  void useTransition;
  throw new Error("TODO: optimistic column move that reconciles on settle");
}
