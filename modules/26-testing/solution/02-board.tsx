/**
 * Task 2 — Component + MSW (reference solution).
 *
 * `Board` fetches its cards from a real `fetch(`${apiUrl}/cards`)` and lets you add one via a form
 * that POSTs. There is NO injected client — that's the point of the test tier: we don't mock
 * `fetch`, we run the component for real and let **MSW** intercept the network at the boundary, so
 * the test exercises the same code path production does (render → effect → fetch → state → paint).
 */
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

export interface BoardCard {
  id: string;
  title: string;
}

export interface BoardProps {
  apiUrl: string;
}

export function Board({ apiUrl }: BoardProps): ReactElement {
  const [cards, setCards] = useState<BoardCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`${apiUrl}/cards`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BoardCard[];
        if (active) setCards(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      active = false;
    };
  }, [apiUrl]);

  async function addCard(): Promise<void> {
    const res = await fetch(`${apiUrl}/cards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const created = (await res.json()) as BoardCard;
    setCards((prev) => [...(prev ?? []), created]);
    setTitle("");
  }

  if (error) return <p role="alert">Error: {error}</p>;
  if (cards === null) return <p>Loading…</p>;

  return (
    <section aria-label="Board">
      <ul>
        {cards.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void addCard();
        }}
      >
        <label htmlFor="new-card">New card title</label>
        <input id="new-card" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
    </section>
  );
}
