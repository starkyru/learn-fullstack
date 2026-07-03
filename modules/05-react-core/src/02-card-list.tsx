import { useState } from "react";

/**
 * YOUR TURN — a list with add/remove.
 * - render an <ul>; each card is an <li> with its title and a "Remove" <button>.
 * - a <form> with a text <input> (aria-label="new card") + "Add" submit button appends a
 *   card (give it a unique id) and clears the input.
 * - update state IMMUTABLY (spread / filter); never mutate the array in place.
 * Start from the given initial titles.
 */
export interface CardItem {
  id: string;
  title: string;
}
export function CardList(_props: { initial?: CardItem[] }) {
  const [_cards, _setCards] = useState<CardItem[]>(_props.initial ?? []);
  throw new Error("TODO: render the list + add/remove with immutable useState updates");
}
