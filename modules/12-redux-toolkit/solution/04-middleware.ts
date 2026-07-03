import {
  configureStore,
  createAction,
  createSlice,
  isAction,
  type Middleware,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Card } from "./01-slices.js";

/**
 * A custom middleware, written from scratch, that implements UNDO. The shape of every Redux
 * middleware is `store => next => action => …`: it sees each action before the reducer. Here we
 * snapshot the board BEFORE each tracked mutation, and on `undo()` we restore the last snapshot.
 */

export interface UndoableBoardState {
  cards: Card[];
}

const initialState: UndoableBoardState = { cards: [] };

export const undoableBoardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    cardAdded: (state, action: PayloadAction<Card>) => {
      state.cards.push(action.payload);
    },
    cardRemoved: (state, action: PayloadAction<string>) => {
      state.cards = state.cards.filter((c) => c.id !== action.payload);
    },
    // Applied by the middleware to roll the board back to a prior snapshot.
    boardRestored: (state, action: PayloadAction<Card[]>) => {
      state.cards = action.payload;
    },
  },
});

export const { cardAdded, cardRemoved, boardRestored } = undoableBoardSlice.actions;
export const undoableBoardReducer = undoableBoardSlice.reducer;

/** Dispatch this to revert the most recent tracked mutation. */
export const undo = createAction("board/undo");

/** The action types whose effect `undo` can reverse. */
export const MUTATION_TYPES: string[] = [cardAdded.type, cardRemoved.type];

export interface UndoableRootState {
  board: UndoableBoardState;
}

export function createUndoMiddleware(): Middleware<object, UndoableRootState> {
  // History of board snapshots, most-recent last. Closed over — private to this middleware.
  // NOTE: unbounded here for clarity; production code would cap depth (e.g. keep the last N).
  const past: Card[][] = [];

  return (store) => (next) => (action) => {
    if (undo.match(action)) {
      const previous = past.pop();
      if (previous !== undefined) store.dispatch(boardRestored(previous));
      return; // swallow: `undo` itself never reaches the reducer
    }
    if (isAction(action) && MUTATION_TYPES.includes(action.type)) {
      // Snapshot the CURRENT cards (a frozen ref from Immer) before the mutation runs.
      past.push(store.getState().board.cards);
    }
    return next(action);
  };
}

export function makeUndoableStore() {
  return configureStore({
    reducer: { board: undoableBoardReducer },
    middleware: (getDefault) => getDefault().concat(createUndoMiddleware()),
  });
}
