/**
 * Task 1 — Unit + TDD (WORKED EXAMPLE).
 *
 * `moveCard` is the fully-solved reference: a PURE reducer `(state, action) -> state` that moves a
 * card between (or within) lists and returns a BRAND-NEW state, never mutating the input. Pure +
 * deterministic = the easiest thing in the world to unit-test, which is why the base of the trophy
 * is wide. The test (`test/01-reducer.test.ts`) was written TDD-first: it pins the exact immutable
 * transitions, so this implementation is just "make the red tests green".
 *
 * YOUR TURN lives in `src/01-reducer.ts`: implement the analog `renameCard` (solved here) so a
 * rename produces the same kind of surgical, reference-preserving update.
 */

export interface Card {
  id: string;
  title: string;
}

export interface List {
  id: string;
  cards: Card[];
}

export interface BoardState {
  lists: List[];
}

export interface MoveCardAction {
  type: "moveCard";
  cardId: string;
  /** list id to move the card OUT of */
  from: string;
  /** list id to move the card INTO (may equal `from`) */
  to: string;
  /** insertion index in the target list, AFTER the card is removed from the source */
  toIndex: number;
}

export interface RenameCardAction {
  type: "renameCard";
  cardId: string;
  title: string;
}

/**
 * Move `cardId` from list `from` to list `to`, inserting at `toIndex`. Immutable: unrelated lists
 * keep their SAME reference, only the touched lists (and the top-level state) are freshly cloned.
 * If the card can't be found in `from`, the original `state` is returned unchanged (same reference).
 */
export function moveCard(state: BoardState, action: MoveCardAction): BoardState {
  const { cardId, from, to, toIndex } = action;

  const source = state.lists.find((list) => list.id === from);
  const card = source?.cards.find((c) => c.id === cardId);
  if (!source || !card) return state;

  const lists = state.lists.map((list) => {
    // Same-list reorder: remove, then splice back in at the requested index.
    if (list.id === from && list.id === to) {
      const without = list.cards.filter((c) => c.id !== cardId);
      return {
        ...list,
        cards: [...without.slice(0, toIndex), card, ...without.slice(toIndex)],
      };
    }
    if (list.id === from) {
      return { ...list, cards: list.cards.filter((c) => c.id !== cardId) };
    }
    if (list.id === to) {
      return {
        ...list,
        cards: [...list.cards.slice(0, toIndex), card, ...list.cards.slice(toIndex)],
      };
    }
    return list;
  });

  return { ...state, lists };
}

/**
 * Rename `cardId` to `title`. Immutable: only the list containing the card (and that one card) is
 * cloned; every other list keeps its reference. If no card matches, `state` is returned unchanged.
 */
export function renameCard(state: BoardState, action: RenameCardAction): BoardState {
  const { cardId, title } = action;

  const owner = state.lists.find((list) => list.cards.some((c) => c.id === cardId));
  if (!owner) return state;

  const lists = state.lists.map((list) => {
    if (list.id !== owner.id) return list;
    return {
      ...list,
      cards: list.cards.map((c) => (c.id === cardId ? { ...c, title } : c)),
    };
  });

  return { ...state, lists };
}
