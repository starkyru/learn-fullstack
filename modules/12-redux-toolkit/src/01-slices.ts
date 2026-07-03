import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Two slices + a memoized selector. The board slice is the worked example — study it, then
 * complete `filtersSlice` (mutate the draft; Immer handles immutability) so the selector works.
 */

// ---- board slice (worked example — study this) -------------------------------------------

export interface Card {
  id: string;
  title: string;
  columnId: string;
}

export interface BoardState {
  cards: Card[];
}

const initialBoardState: BoardState = { cards: [] };

export const boardSlice = createSlice({
  name: "board",
  initialState: initialBoardState,
  reducers: {
    cardAdded: (state, action: PayloadAction<Card>) => {
      state.cards.push(action.payload);
    },
    cardMoved: (state, action: PayloadAction<{ id: string; toColumnId: string }>) => {
      const card = state.cards.find((c) => c.id === action.payload.id);
      if (card) card.columnId = action.payload.toColumnId;
    },
    cardRemoved: (state, action: PayloadAction<string>) => {
      state.cards = state.cards.filter((c) => c.id !== action.payload);
    },
  },
});

export const { cardAdded, cardMoved, cardRemoved } = boardSlice.actions;
export const boardReducer = boardSlice.reducer;

// ---- filters slice (YOUR TURN) -----------------------------------------------------------
//
// Implement the two reducers so they update the draft state:
//   queryChanged    → set state.query    to the string payload
//   columnFilterSet → set state.columnId to the (string | null) payload

export interface FiltersState {
  query: string;
  columnId: string | null;
}

const initialFiltersState: FiltersState = { query: "", columnId: null };

export const filtersSlice = createSlice({
  name: "filters",
  initialState: initialFiltersState,
  reducers: {
    queryChanged: (_state, _action: PayloadAction<string>) => {
      throw new Error("TODO: set state.query to the payload");
    },
    columnFilterSet: (_state, _action: PayloadAction<string | null>) => {
      throw new Error("TODO: set state.columnId to the payload");
    },
  },
});

export const { queryChanged, columnFilterSet } = filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;

// ---- selectors ---------------------------------------------------------------------------

export interface RootState {
  board: BoardState;
  filters: FiltersState;
}

export const selectCards = (state: RootState): Card[] => state.board.cards;
export const selectFilters = (state: RootState): FiltersState => state.filters;

// Build a MEMOIZED selector (createSelector) that returns cards matching both the column
// filter (null = all columns) and a case-insensitive title search. Two calls with the same
// state must return the SAME array reference.
export const selectVisibleCards = createSelector(
  [selectCards, selectFilters],
  (_cards, _filters): Card[] => {
    throw new Error("TODO: filter cards by column + case-insensitive query");
  },
);
