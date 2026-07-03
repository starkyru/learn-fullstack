import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Card } from "./01-slices.js";

/**
 * `createAsyncThunk` turns one async function into three actions — pending / fulfilled /
 * rejected — that you handle in `extraReducers` to drive a status machine. The network call
 * lives behind the store's `extra` argument (a `BoardApi`), so no fetch/MSW is needed.
 *
 * YOUR TURN — fill in `extraReducers` so:
 *   loadBoard.pending   → status "loading", error null
 *   loadBoard.fulfilled → status "succeeded", cards = action.payload
 *   loadBoard.rejected  → status "failed",  error = action.error.message (fallback string)
 * Use the `builder.addCase(thunk.pending, (state, action) => {...})` form.
 */

export interface BoardApi {
  fetchBoard: (boardId: string) => Promise<Card[]>;
}

export const loadBoard = createAsyncThunk<Card[], string, { extra: BoardApi }>(
  "asyncBoard/load",
  async (boardId, { extra }) => extra.fetchBoard(boardId),
);

export type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AsyncBoardState {
  cards: Card[];
  status: LoadStatus;
  error: string | null;
}

const initialState: AsyncBoardState = { cards: [], status: "idle", error: null };

export const asyncBoardSlice = createSlice({
  name: "asyncBoard",
  initialState,
  reducers: {},
  extraReducers: (_builder) => {
    // TODO: handle loadBoard.pending / .fulfilled / .rejected (see the doc comment above).
  },
});

export const asyncBoardReducer = asyncBoardSlice.reducer;

export function makeAsyncBoardStore(api: BoardApi) {
  return configureStore({
    reducer: { asyncBoard: asyncBoardReducer },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: api } }),
  });
}
