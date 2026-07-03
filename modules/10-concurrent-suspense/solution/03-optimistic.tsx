import { useOptimistic, useState } from "react";

/**
 * Optimistic "add card": show the new card the instant the user submits, before the
 * server confirms. `useOptimistic` renders the optimistic state during the async
 * action (a form action runs inside a transition); when the action ends React
 * discards the optimistic layer and shows the real `cards`. So if `addCard` rejects
 * and we never commit, the card automatically rolls back.
 */
export function CardAdder({
  initialCards,
  addCard,
}: {
  initialCards: string[];
  addCard: (title: string) => Promise<void>;
}) {
  const [cards, setCards] = useState(initialCards);
  const [optimisticCards, addOptimistic] = useOptimistic(
    cards,
    (state: string[], newCard: string) => [...state, newCard],
  );
  const [error, setError] = useState<string | null>(null);

  async function formAction(formData: FormData) {
    const title = String(formData.get("title") ?? "");
    setError(null);
    addOptimistic(title);
    try {
      await addCard(title);
      setCards((c) => [...c, title]); // commit only on success
    } catch {
      setError("Failed to add card"); // no commit → optimistic card rolls back
    }
  }

  return (
    <form action={formAction}>
      <label htmlFor="new-card">New card</label>
      <input id="new-card" name="title" />
      <button type="submit">Add</button>
      {error && <p role="alert">{error}</p>}
      <ul aria-label="cards">
        {optimisticCards.map((c, i) => (
          <li key={`${c}-${i}`}>{c}</li>
        ))}
      </ul>
    </form>
  );
}
