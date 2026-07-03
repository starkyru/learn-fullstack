import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Two slices + a memoized selector that derives the visible cards from both. Reducers look
 * mutating but Immer makes them immutable — you mutate the `draft`, RTK produces a new state.
 */

// ---- board slice (worked example) --------------------------------------------------------

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

// ---- filters slice (analog you complete in src/) -----------------------------------------

export interface FiltersState {
  query: string;
  columnId: string | null;
}

const initialFiltersState: FiltersState = { query: "", columnId: null };

export const filtersSlice = createSlice({
  name: "filters",
  initialState: initialFiltersState,
  reducers: {
    queryChanged: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    columnFilterSet: (state, action: PayloadAction<string | null>) => {
      state.columnId = action.payload;
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

/**
 * Memoized: recomputes ONLY when `cards` or `filters` change identity. Two calls with the same
 * state return the very same array reference — so a connected component won't re-render on
 * unrelated state changes.
 */
export const selectVisibleCards = createSelector(
  [selectCards, selectFilters],
  (cards, filters) =>
    cards.filter(
      (card) =>
        (filters.columnId === null || card.columnId === filters.columnId) &&
        card.title.toLowerCase().includes(filters.query.toLowerCase()),
    ),
);
