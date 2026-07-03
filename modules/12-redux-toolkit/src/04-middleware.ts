import {
  configureStore,
  createAction,
  createSlice,
  type Middleware,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Card } from "./01-slices.js";

/**
 * A custom middleware, written from scratch, that implements UNDO.
 *
 * YOUR TURN — build `createUndoMiddleware`. Every middleware is `store => next => action => …`.
 *   - Keep a private `past: Card[][]` history (closure variable).
 *   - When the action is a tracked mutation (`MUTATION_TYPES.includes(action.type)` — use the
 *     `isAction` guard from RTK), push `store.getState().board.cards` onto `past` BEFORE calling
 *     `next(action)` (Immer's arrays are frozen, so the ref stays a valid snapshot).
 *   - When the action is `undo()` (`undo.match(action)`), pop the last snapshot and, if present,
 *     `store.dispatch(boardRestored(previous))`; then RETURN without calling `next` (swallow it).
 *   - Otherwise just `return next(action)`.
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
    boardRestored: (state, action: PayloadAction<Card[]>) => {
      state.cards = action.payload;
    },
  },
});

export const { cardAdded, cardRemoved, boardRestored } = undoableBoardSlice.actions;
export const undoableBoardReducer = undoableBoardSlice.reducer;

export const undo = createAction("board/undo");

export const MUTATION_TYPES: string[] = [cardAdded.type, cardRemoved.type];

export interface UndoableRootState {
  board: UndoableBoardState;
}

export function createUndoMiddleware(): Middleware<object, UndoableRootState> {
  return (_store) => (_next) => (_action) => {
    throw new Error("TODO: snapshot on mutations, restore on undo()");
  };
}

export function makeUndoableStore() {
  return configureStore({
    reducer: { board: undoableBoardReducer },
    middleware: (getDefault) => getDefault().concat(createUndoMiddleware()),
  });
}
