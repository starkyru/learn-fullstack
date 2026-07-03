import type { ReactElement } from "react";
import { AddCardButton } from "./add-card-button.js";
import type { Board } from "./board-service.js";

/**
 * The board is a React Server Component: an `async` function that renders columns and
 * cards as static host elements — no event handlers, no client JS. It *includes* the
 * `<AddCardButton>` client island for interactivity but owns none of its behavior.
 * Awaiting it returns the element tree, so a test can assert the rendered structure and
 * prove the server part carries no `onClick`.
 */
export async function BoardView({ board }: { board: Board }): Promise<ReactElement> {
  return (
    <section aria-label="board" className="flex gap-4 p-6" data-board={board.id}>
      {board.columns.map((col) => (
        <div
          key={col.id}
          className="w-64 rounded-xl bg-gray-100 p-3"
          data-column={col.id}
        >
          <h2 className="mb-2 text-sm font-semibold text-gray-700">{col.title}</h2>
          <ul aria-label={`cards-${col.id}`} className="flex flex-col gap-2">
            {col.cards.map((card) => (
              <li
                key={card.id}
                className="rounded-xl bg-white px-3 py-2 text-sm shadow"
                data-card={card.id}
              >
                {card.title}
              </li>
            ))}
          </ul>
          <AddCardButton boardId={board.id} columnId={col.id} />
        </div>
      ))}
    </section>
  );
}
