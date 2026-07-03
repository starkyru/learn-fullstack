"use client";

import { useOptimistic, useState, useTransition } from "react";

/**
 * Optimistic card move across two columns. On click we show the card in its new column
 * the instant the user acts, then call the `moveCard` action; when it settles we commit
 * the AUTHORITATIVE list it returns (as if re-fetched after `revalidateTag`). Because
 * the optimistic update lives only inside the transition, React drops it when the action
 * ends and shows the committed `cards` — so if the server disagrees, the move reconciles
 * back automatically (no manual rollback).
 *
 * `useOptimistic(cards, reducer)` needs its `applyMove` call to run inside a transition
 * or action, hence `startTransition`.
 */

export type Column = "todo" | "done";
export type Card = { id: string; title: string; column: Column };

// The action returns the server's truth for the board after the move — this is what a
// real `moveCard` would give you once the "cards" tag is revalidated and re-read.
export type MoveCard = (id: string, to: Column) => Promise<Card[]>;

export function CardBoard({
  initialCards,
  moveCard,
}: {
  initialCards: Card[];
  moveCard: MoveCard;
}) {
  const [cards, setCards] = useState(initialCards);
  const [optimisticCards, applyMove] = useOptimistic(
    cards,
    (state: Card[], move: { id: string; to: Column }) =>
      state.map((c) => (c.id === move.id ? { ...c, column: move.to } : c)),
  );
  const [, startTransition] = useTransition();

  function move(id: string, to: Column) {
    startTransition(async () => {
      applyMove({ id, to }); // optimistic: card jumps columns immediately
      const settled = await moveCard(id, to);
      setCards(settled); // commit server truth → optimistic layer reconciles
    });
  }

  const byColumn = (col: Column) => optimisticCards.filter((c) => c.column === col);

  return (
    <div>
      {(["todo", "done"] as const).map((col) => (
        <ul key={col} aria-label={col}>
          {byColumn(col).map((card) => {
            const to: Column = card.column === "todo" ? "done" : "todo";
            return (
              <li key={card.id}>
                {card.title}
                <button type="button" onClick={() => move(card.id, to)}>
                  Move {card.title}
                </button>
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
