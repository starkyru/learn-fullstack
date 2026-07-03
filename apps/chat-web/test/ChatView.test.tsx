import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatView } from "../src/ChatView.js";
import { createChatStore } from "../src/chatSlice.js";
import {
  createSocketStore,
  type Scheduler,
  type Socket,
  type SocketStore,
} from "../src/socket-store.js";
import type { Message } from "../src/types.js";

/** Controllable stand-in for socket.io — no network. */
class FakeSocket implements Socket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readonly sent: Array<{ event: string; data: unknown }> = [];
  private readonly handlers = new Map<string, (data: unknown) => void>();

  connect(): void {}
  close(): void {}
  emit(event: string, data: unknown): void {
    this.sent.push({ event, data });
  }
  on(event: string, handler: (data: unknown) => void): void {
    this.handlers.set(event, handler);
  }
  fireOpen(): void {
    this.onopen?.();
  }
  fireMessage(data: unknown): void {
    this.handlers.get("message")?.(data);
  }
}

/** No-op clock — no reconnects are exercised here. */
const noopScheduler: Scheduler = {
  setTimeout: () => 0,
  clearTimeout: () => {},
};

function setup() {
  const sockets: FakeSocket[] = [];
  const socket: SocketStore = createSocketStore({
    createSocket: () => {
      const s = new FakeSocket();
      sockets.push(s);
      return s;
    },
    scheduler: noopScheduler,
  });
  const store = createChatStore();
  let seq = 0;
  const nextId = () => `local-${++seq}`;
  render(
    <ChatView
      store={store}
      socket={socket}
      currentUser={{ id: "u-me", name: "Me" }}
      nextId={nextId}
    />,
  );
  return { sockets, socket, store };
}

function messageRows(): string[] {
  return screen.queryAllByTestId("message").map((el) => el.textContent);
}

describe("ChatView", () => {
  it("renders messages arriving from the socket into the current channel", () => {
    const { sockets } = setup();
    const fake = sockets[0]!;
    act(() => fake.fireOpen());
    expect(screen.getByTestId("status").textContent).toBe("open");
    expect(screen.getByText("No messages yet — say hi.")).toBeTruthy();

    const inbound: Message = {
      id: "srv-1",
      channelId: "general",
      authorId: "u-alice",
      authorName: "Alice",
      text: "hello",
      status: "sent",
    };
    act(() => fake.fireMessage(inbound));

    expect(messageRows()).toEqual(["Alice hello"]);
    expect(screen.getByTestId("message").getAttribute("data-status")).toBe("sent");
  });

  it("ignores a socket message addressed to a different channel", () => {
    const { sockets } = setup();
    act(() => sockets[0]!.fireOpen());
    act(() =>
      sockets[0]!.fireMessage({
        id: "srv-9",
        channelId: "random",
        authorId: "u-x",
        authorName: "Xavier",
        text: "elsewhere",
        status: "sent",
      } satisfies Message),
    );
    expect(messageRows()).toEqual([]);
  });

  it("appends a sent message optimistically and emits it over the socket", () => {
    const { sockets } = setup();
    act(() => sockets[0]!.fireOpen());

    const input = screen.getByLabelText("Message");
    fireEvent.change(input, { target: { value: "first post" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    // Appears immediately, before any server echo, flagged pending.
    expect(messageRows()).toEqual(["Me first post"]);
    expect(screen.getByTestId("message").getAttribute("data-status")).toBe("pending");
    // Composer cleared.
    expect((input as HTMLInputElement).value).toBe("");
    // And it was emitted on the wire with the deterministic id.
    expect(sockets[0]!.sent).toEqual([
      {
        event: "message",
        data: {
          id: "local-1",
          channelId: "general",
          authorId: "u-me",
          authorName: "Me",
          text: "first post",
          status: "pending",
        },
      },
    ]);
  });

  it("does not send an empty/whitespace-only composer", () => {
    const { sockets } = setup();
    act(() => sockets[0]!.fireOpen());
    const input = screen.getByLabelText("Message");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(messageRows()).toEqual([]);
    expect(sockets[0]!.sent).toEqual([]);
  });
});
