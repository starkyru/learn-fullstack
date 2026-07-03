import {
  configureStore,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Message } from "./types.js";

/**
 * The Chat slice: channel selection, composer text, and the message log. Reducers look mutating
 * but Immer makes them immutable. This is the client-side source of truth the view renders from
 * (subscribed via `useSyncExternalStore`, not react-redux, to keep the SPA dependency-light).
 */

export interface ChatState {
  channelId: string;
  composerText: string;
  messages: Message[];
}

const initialState: ChatState = {
  channelId: "general",
  composerText: "",
  messages: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    channelSwitched: (state, action: PayloadAction<string>) => {
      state.channelId = action.payload;
      state.composerText = "";
    },
    composerChanged: (state, action: PayloadAction<string>) => {
      state.composerText = action.payload;
    },
    /** Optimistic send: append the message (status stays `pending`) and clear the composer. */
    messageSent: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      state.composerText = "";
    },
    /** Server confirmation for an id we already show optimistically. */
    messageDelivered: (state, action: PayloadAction<string>) => {
      const message = state.messages.find((m) => m.id === action.payload);
      if (message) message.status = "sent";
    },
    /** Inbound message from the socket: mark an existing id delivered, else append it. */
    messageReceived: (state, action: PayloadAction<Message>) => {
      const existing = state.messages.find((m) => m.id === action.payload.id);
      if (existing) {
        existing.status = "sent";
        return;
      }
      state.messages.push(action.payload);
    },
  },
});

export const {
  channelSwitched,
  composerChanged,
  messageSent,
  messageDelivered,
  messageReceived,
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;

// ---- store ------------------------------------------------------------------------------

export function createChatStore(preloadedState?: { chat: ChatState }) {
  return configureStore({
    reducer: { chat: chatReducer },
    preloadedState,
  });
}

export type ChatStore = ReturnType<typeof createChatStore>;
export type RootState = ReturnType<ChatStore["getState"]>;
export type AppDispatch = ChatStore["dispatch"];

// ---- selectors --------------------------------------------------------------------------

const selectChat = (state: RootState): ChatState => state.chat;
export const selectChannelId = (state: RootState): string => state.chat.channelId;
export const selectComposerText = (state: RootState): string => state.chat.composerText;

/**
 * Memoized: only the currently-selected channel's messages, recomputed when `chat` state changes
 * identity. A stable reference between unrelated renders keeps `useSyncExternalStore` from tripping
 * its "getSnapshot should be cached" guard.
 */
export const selectVisibleMessages = createSelector([selectChat], (chat) =>
  chat.messages.filter((m) => m.channelId === chat.channelId),
);
