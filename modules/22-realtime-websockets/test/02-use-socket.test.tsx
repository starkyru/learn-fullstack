// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createSocketStore,
  useSocket,
  type Scheduler,
  type Socket,
  type SocketStore,
} from "../solution/02-use-socket.js";

/** A controllable stand-in for a real socket.io client — no network. */
class FakeSocket implements Socket {
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  connectCalls = 0;
  closeCalls = 0;
  readonly sent: Array<{ event: string; data: unknown }> = [];
  private readonly handlers = new Map<string, (data: unknown) => void>();

  connect(): void {
    this.connectCalls += 1;
  }
  close(): void {
    this.closeCalls += 1;
  }
  emit(event: string, data: unknown): void {
    this.sent.push({ event, data });
  }
  on(event: string, handler: (data: unknown) => void): void {
    this.handlers.set(event, handler);
  }

  fireOpen(): void {
    this.onopen?.();
  }
  fireClose(): void {
    this.onclose?.();
  }
  fireMessage(data: unknown): void {
    this.handlers.get("message")?.(data);
  }
}

/** A fake clock: nothing runs until the test explicitly advances it. */
class FakeScheduler implements Scheduler {
  private seq = 0;
  private readonly tasks = new Map<number, { fn: () => void; ms: number }>();

  setTimeout(fn: () => void, ms: number): number {
    const handle = ++this.seq;
    this.tasks.set(handle, { fn, ms });
    return handle;
  }
  clearTimeout(handle: number): void {
    this.tasks.delete(handle);
  }

  pendingDelays(): number[] {
    return [...this.tasks.values()].map((t) => t.ms);
  }
  runNext(): number {
    const [handle] = [...this.tasks.keys()];
    if (handle === undefined) throw new Error("no pending scheduled task");
    const task = this.tasks.get(handle)!;
    this.tasks.delete(handle);
    task.fn();
    return task.ms;
  }
}

function setup(overrides: { baseDelay?: number; maxDelay?: number } = {}) {
  const sockets: FakeSocket[] = [];
  const scheduler = new FakeScheduler();
  const store = createSocketStore({
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    scheduler,
    baseDelay: overrides.baseDelay ?? 100,
    maxDelay: overrides.maxDelay ?? 400,
  });
  return { sockets, scheduler, store };
}

describe("Task 2 — createSocketStore", () => {
  it("starts connecting and transitions to open when the socket opens", () => {
    const { sockets, store } = setup();
    expect(store.getSnapshot().status).toBe("connecting");
    expect(sockets[0]!.connectCalls).toBe(1);

    sockets[0]!.fireOpen();
    expect(store.getSnapshot().status).toBe("open");
  });

  it("updates lastMessage and notifies subscribers exactly once per message", () => {
    const { sockets, store } = setup();
    sockets[0]!.fireOpen();

    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });

    sockets[0]!.fireMessage({ from: "alice", text: "hello" });
    expect(store.getSnapshot().lastMessage).toEqual({ from: "alice", text: "hello" });
    expect(notifications).toBe(1);

    sockets[0]!.fireMessage({ from: "bob", text: "hi" });
    expect(store.getSnapshot().lastMessage).toEqual({ from: "bob", text: "hi" });
    expect(notifications).toBe(2);
  });

  it("send() forwards to the live socket's emit", () => {
    const { sockets, store } = setup();
    sockets[0]!.fireOpen();

    store.send("message", { text: "ping" });
    expect(sockets[0]!.sent).toEqual([{ event: "message", data: { text: "ping" } }]);
  });

  it("reconnects on close with exponential backoff capped at maxDelay", () => {
    const { sockets, scheduler, store } = setup({ baseDelay: 100, maxDelay: 400 });

    sockets[0]!.fireClose();
    expect(store.getSnapshot().status).toBe("closed");
    expect(scheduler.pendingDelays()).toEqual([100]);

    expect(scheduler.runNext()).toBe(100); // fires reconnect → sockets[1]
    expect(store.getSnapshot().status).toBe("connecting");
    expect(sockets).toHaveLength(2);

    sockets[1]!.fireClose();
    expect(scheduler.pendingDelays()).toEqual([200]);
    scheduler.runNext();

    sockets[2]!.fireClose();
    expect(scheduler.pendingDelays()).toEqual([400]);
    scheduler.runNext();

    sockets[3]!.fireClose();
    expect(scheduler.pendingDelays()).toEqual([400]); // 800 capped to 400
  });

  it("close() stops reconnection: marks closed, closes the socket, and schedules no reconnect", () => {
    const { sockets, scheduler, store } = setup({ baseDelay: 100, maxDelay: 400 });
    sockets[0]!.fireOpen();
    expect(store.getSnapshot().status).toBe("open");

    store.close();
    expect(sockets[0]!.closeCalls).toBe(1); // (b) underlying socket.close() was called

    // The real socket then completes its close and fires onclose.
    sockets[0]!.fireClose();
    expect(store.getSnapshot().status).toBe("closed"); // (a)

    // (c) closedByUser suppresses the reconnect that an unexpected close would schedule,
    // even after advancing the clock past the backoff window.
    expect(scheduler.pendingDelays()).toEqual([]);
    expect(sockets).toHaveLength(1); // no reconnect socket spawned
  });

  it("close() clears a pending reconnect timer (advancing the clock cannot resurrect it)", () => {
    const { sockets, scheduler, store } = setup({ baseDelay: 100, maxDelay: 400 });

    sockets[0]!.fireClose(); // unexpected drop schedules a reconnect
    expect(store.getSnapshot().status).toBe("closed");
    expect(scheduler.pendingDelays()).toEqual([100]);

    store.close(); // (d) must clearTimeout the pending reconnect handle
    expect(scheduler.pendingDelays()).toEqual([]); // timer gone; nothing left to fire
    expect(sockets).toHaveLength(1); // and no reconnect socket was created
  });

  it("resets the backoff ladder after a successful open", () => {
    const { sockets, scheduler, store } = setup({ baseDelay: 100, maxDelay: 400 });

    sockets[0]!.fireClose();
    expect(scheduler.pendingDelays()).toEqual([100]);
    scheduler.runNext();

    sockets[1]!.fireClose(); // would be 200 while the ladder is climbing
    expect(scheduler.pendingDelays()).toEqual([200]);
    scheduler.runNext();

    sockets[2]!.fireOpen(); // clean connection resets attempt to 0
    expect(store.getSnapshot().status).toBe("open");

    sockets[2]!.fireClose();
    expect(scheduler.pendingDelays()).toEqual([100]); // back to base, not 400
  });
});

describe("Task 2 — useSocket hook", () => {
  it("renders the store status and reflects transitions", () => {
    const { sockets, store } = setup();
    function Probe() {
      const { status } = useSocket(store);
      return <span data-testid="status">{status}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("status").textContent).toBe("connecting");

    act(() => sockets[0]!.fireOpen());
    expect(screen.getByTestId("status").textContent).toBe("open");
  });

  it("unsubscribes from the store on unmount (no listener leak)", () => {
    const { sockets, store } = setup();
    let liveListeners = 0;
    const realSubscribe = store.subscribe;
    const wrapped: SocketStore = {
      ...store,
      subscribe(listener) {
        liveListeners += 1;
        const unsub = realSubscribe(listener);
        return () => {
          liveListeners -= 1;
          unsub();
        };
      },
    };

    function Probe() {
      const { status } = useSocket(wrapped);
      return <span>{status}</span>;
    }
    const { unmount } = render(<Probe />);
    expect(liveListeners).toBe(1);

    unmount();
    expect(liveListeners).toBe(0);

    // A post-unmount change must not reach the unmounted component.
    act(() => sockets[0]!.fireOpen());
    expect(liveListeners).toBe(0);
  });
});
