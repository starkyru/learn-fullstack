import type { ReactElement } from "react";
import { BoardView } from "../../src/board/board-view.js";
import { boardStore } from "../../src/board/board-service.js";

/**
 * The board route — the composition root. As an async Server Component it fetches the board
 * on the server (here from the in-memory `boardStore`; M1 swaps in the Prisma repo from
 * `@learn-fullstack/db`) and streams the rendered tree to the client with zero client JS
 * except the `<AddCardButton>` islands nested inside `<BoardView>`.
 */
export default async function BoardPage(): Promise<ReactElement> {
  const board = await boardStore.getBoard("b1");
  return (
    <main>
      <h1 className="px-6 pt-6 text-lg font-bold">{board.title}</h1>
      <BoardView board={board} />
    </main>
  );
}
