import { useSyncExternalStore } from "react";

/**
 * Reconnecting socket store + `useSocket` hook — the module-22 pattern (a `useSyncExternalStore`
 * store over an INJECTED socket factory + injected `Scheduler`). Nothing here talks to a real
 * network or real timers: tests drive it with a fake socket and a fake clock. The real socket.io
 * adapter + `window.setTimeout` scheduler are wired only in `main.tsx`.
 *
 * On an unexpected `close` it reconnects with EXPONENTIAL BACKOFF: attempt N waits
 * `min(base * 2 ** N, max)`. A clean `open` resets the ladder to 0. A manual `close()` cancels any
 * pending reconnect and stays closed.
 */

export type SocketStatus = "connecting" | "open" | "closed";

/** Minimal transport the store depends on — a real socket.io client or a test fake implements it. */
export interface Socket {
  connect(): void;
  close(): void;
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
}

/** Injected timer boundary so backoff is deterministic under test (no real `setTimeout`). */
export interface Scheduler {
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(handle: number): void;
}

export interface SocketSnapshot {
  status: SocketStatus;
  lastMessage: unknown;
}

export interface SocketStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): SocketSnapshot;
  send(event: string, data: unknown): void;
  /** Manual close — cancels any pending reconnect and does NOT reconnect. */
  close(): void;
}

export interface SocketStoreOptions {
  createSocket: () => Socket;
  scheduler: Scheduler;
  /** First backoff delay in ms (default 100). */
  baseDelay?: number;
  /** Upper bound the backoff is capped to (default 5000). */
  maxDelay?: number;
  /** Server event carrying inbound messages (default "message"). */
  messageEvent?: string;
}

export function createSocketStore(options: SocketStoreOptions): SocketStore {
  const {
    createSocket,
    scheduler,
    baseDelay = 100,
    maxDelay = 5000,
    messageEvent = "message",
  } = options;

  const listeners = new Set<() => void>();
  let status: SocketStatus = "connecting";
  let lastMessage: unknown = null;
  let attempt = 0;
  let socket: Socket | null = null;
  let reconnectHandle: number | null = null;
  let closedByUser = false;
  // Cached snapshot: identity changes ONLY when state changes, so useSyncExternalStore is stable.
  let snapshot: SocketSnapshot = { status, lastMessage };

  function emitChange(): void {
    snapshot = { status, lastMessage };
    for (const listener of [...listeners]) listener();
  }

  function setStatus(next: SocketStatus): void {
    if (status === next) return;
    status = next;
    emitChange();
  }

  function spawn(): void {
    const next = createSocket();
    socket = next;
    next.onopen = () => {
      attempt = 0; // a clean connection resets the backoff ladder
      setStatus("open");
    };
    next.onclose = () => {
      socket = null;
      setStatus("closed");
      if (!closedByUser) scheduleReconnect();
    };
    next.on(messageEvent, (data) => {
      lastMessage = data;
      emitChange();
    });
    next.connect();
  }

  function scheduleReconnect(): void {
    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
    attempt += 1;
    reconnectHandle = scheduler.setTimeout(() => {
      reconnectHandle = null;
      setStatus("connecting");
      spawn();
    }, delay);
  }

  spawn();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    send(event, data) {
      socket?.emit(event, data);
    },
    close() {
      closedByUser = true;
      if (reconnectHandle !== null) {
        scheduler.clearTimeout(reconnectHandle);
        reconnectHandle = null;
      }
      socket?.close();
    },
  };
}

export interface UseSocketResult {
  status: SocketStatus;
  lastMessage: unknown;
  send: (event: string, data: unknown) => void;
}

/** React binding: subscribe to the store's snapshot and expose `{ status, lastMessage, send }`. */
export function useSocket(store: SocketStore): UseSocketResult {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return {
    status: snapshot.status,
    lastMessage: snapshot.lastMessage,
    send: store.send,
  };
}
