import { useOptimistic, useState } from "react";

/**
 * YOUR TURN — build a <CardAdder> with an optimistic add that rolls back on failure.
 * Hint-only:
 *
 * 1. Hold the committed list in `useState(initialCards)`.
 * 2. `const [optimisticCards, addOptimistic] = useOptimistic(cards, (state, newCard)
 *    => [...state, newCard])`.
 * 3. Render a `<form action={formAction}>` with a named `<input name="title">`
 *    (linked to a `<label htmlFor>`) and a submit button. A form action runs inside
 *    a transition — that's what makes `useOptimistic` show the pending value.
 * 4. In `formAction(formData)`: read the title, `addOptimistic(title)`, then
 *    `await addCard(title)`. On success `setCards(c => [...c, title])` (commit). On
 *    reject, set an error and DON'T commit — React drops the optimistic layer, so
 *    the card disappears (rollback).
 * 5. Render `optimisticCards` in a `<ul aria-label="cards">` and the error in a
 *    `<p role="alert">`.
 */
export function CardAdder(_props: {
  initialCards: string[];
  addCard: (title: string) => Promise<void>;
}) {
  void useOptimistic;
  void useState;
  throw new Error("TODO: optimistic add with rollback via useOptimistic");
}
