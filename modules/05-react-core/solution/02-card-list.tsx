import { useState } from "react";

export interface CardItem {
  id: string;
  title: string;
}

export function CardList({ initial = [] }: { initial?: CardItem[] }) {
  const [cards, setCards] = useState<CardItem[]>(initial);
  const [draft, setDraft] = useState("");
  let counter = cards.length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    counter += 1;
    setCards((prev) => [...prev, { id: `c${counter}-${title}`, title }]);
    setDraft("");
  }

  function remove(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <ul>
        {cards.map((c) => (
          <li key={c.id}>
            {c.title}
            <button type="button" onClick={() => remove(c.id)}>
              Remove {c.title}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add}>
        <input
          aria-label="new card"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
