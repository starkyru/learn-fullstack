export interface Card {
  id: string;
  title: string;
  columnId: string;
}
export interface BoardState {
  cards: Card[];
}
export type BoardAction =
  | { type: "add"; card: Card }
  | { type: "rename"; id: string; title: string }
  | { type: "move"; id: string; toColumnId: string };

/**
 * YOUR TURN — a pure reducer for the board. Handle:
 *  - "add": append the card
 *  - "rename": set the matching card's title
 *  - "move": set the matching card's columnId
 * Return NEW state/arrays (immutable); never mutate `state`.
 */
export function boardReducer(_state: BoardState, _action: BoardAction): BoardState {
  throw new Error("TODO: implement the board reducer immutably");
}
