import { describe, expect, it } from "vitest";
import {
  chatReducer,
  channelSwitched,
  composerChanged,
  messageDelivered,
  messageReceived,
  messageSent,
  selectVisibleMessages,
  type ChatState,
} from "../src/chatSlice.js";
import type { Message } from "../src/types.js";

const base: ChatState = { channelId: "general", composerText: "", messages: [] };

function msg(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    channelId: "general",
    authorId: "u1",
    authorName: "Alice",
    text: "hello",
    status: "pending",
    ...overrides,
  };
}

describe("chatReducer", () => {
  it("composerChanged sets the composer text and touches nothing else", () => {
    const next = chatReducer(base, composerChanged("hi the"));
    expect(next).toEqual({ channelId: "general", composerText: "hi the", messages: [] });
  });

  it("messageSent appends the (pending) message and clears the composer", () => {
    const start: ChatState = { ...base, composerText: "hello" };
    const next = chatReducer(start, messageSent(msg()));
    expect(next.composerText).toBe("");
    expect(next.messages).toEqual([msg({ status: "pending" })]);
  });

  it("messageDelivered flips exactly the matching id to sent", () => {
    const start: ChatState = {
      ...base,
      messages: [msg({ id: "m1" }), msg({ id: "m2", text: "world" })],
    };
    const next = chatReducer(start, messageDelivered("m2"));
    expect(next.messages.map((m) => [m.id, m.status])).toEqual([
      ["m1", "pending"],
      ["m2", "sent"],
    ]);
  });

  it("messageReceived appends a new inbound message as sent", () => {
    const next = chatReducer(base, messageReceived(msg({ id: "x", status: "sent" })));
    expect(next.messages).toEqual([msg({ id: "x", status: "sent" })]);
  });

  it("messageReceived dedupes by id and marks the existing optimistic message sent", () => {
    const start: ChatState = {
      ...base,
      messages: [msg({ id: "m1", status: "pending" })],
    };
    const next = chatReducer(start, messageReceived(msg({ id: "m1", status: "sent" })));
    expect(next.messages).toHaveLength(1);
    expect(next.messages[0]!.status).toBe("sent");
  });

  it("channelSwitched changes the channel and clears the composer", () => {
    const start: ChatState = { ...base, composerText: "draft" };
    const next = chatReducer(start, channelSwitched("random"));
    expect(next.channelId).toBe("random");
    expect(next.composerText).toBe("");
  });
});

describe("selectVisibleMessages", () => {
  it("returns only the current channel's messages", () => {
    const state = {
      chat: {
        channelId: "general",
        composerText: "",
        messages: [
          msg({ id: "a", channelId: "general", text: "one" }),
          msg({ id: "b", channelId: "random", text: "two" }),
          msg({ id: "c", channelId: "general", text: "three" }),
        ],
      },
    };
    expect(selectVisibleMessages(state).map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("memoizes: same state input returns the identical array reference", () => {
    const state = {
      chat: { channelId: "general", composerText: "", messages: [msg({ id: "a" })] },
    };
    expect(selectVisibleMessages(state)).toBe(selectVisibleMessages(state));
  });
});
