import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Card } from "./01-slices.js";

/**
 * `createAsyncThunk` turns one async function into three actions — pending / fulfilled /
 * rejected — that you handle in `extraReducers` to drive a status machine. The network call
 * lives behind the store's `extra` argument (a `BoardApi`), so this is testable with a plain
 * fake — no fetch, no MSW.
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
  extraReducers: (builder) => {
    builder
      .addCase(loadBoard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadBoard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cards = action.payload;
      })
      .addCase(loadBoard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Unknown error";
      });
  },
});

export const asyncBoardReducer = asyncBoardSlice.reducer;

/** A store wired with the API dependency injected as the thunk `extra` argument. */
export function makeAsyncBoardStore(api: BoardApi) {
  return configureStore({
    reducer: { asyncBoard: asyncBoardReducer },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: api } }),
  });
}
