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

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "add":
      return { cards: [...state.cards, action.card] };
    case "rename":
      return {
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, title: action.title } : c,
        ),
      };
    case "move":
      return {
        cards: state.cards.map((c) =>
          c.id === action.id ? { ...c, columnId: action.toColumnId } : c,
        ),
      };
  }
}
