/**
 * Task 1 — Unit + TDD (WORKED EXAMPLE).
 *
 * `moveCard` below is solved — read it as the model of a PURE, immutable reducer. Then do YOUR TURN:
 * implement `renameCard` so it renames one card without mutating the input and while keeping every
 * untouched list's reference intact. The TDD'd tests import from `solution/`; flip them to
 * `../src/...` to grade your own build.
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
 * YOUR TURN: rename `cardId` to `action.title`. Return a NEW state; clone only the list that owns
 * the card (and that one card), keep every other list's reference; if no card matches, return the
 * original `state` unchanged. Mirror the surgical, immutable style of `moveCard` above.
 */
export function renameCard(_state: BoardState, _action: RenameCardAction): BoardState {
  throw new Error(
    "TODO: return a new state with the card renamed, keeping untouched lists by reference",
  );
}
