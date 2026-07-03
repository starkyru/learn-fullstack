/**
 * Task 2 — `useSocket` client (FROM SCRATCH).
 *
 * A reconnecting socket store + a `useSocket` React hook on `useSyncExternalStore`. The store is
 * framework-agnostic: it talks to a `Socket` interface (not socket.io directly) and schedules
 * reconnects through an INJECTED `Scheduler`, so tests drive it with a fake socket + fake clock —
 * no real network, no real timers.
 *
 * The store is a closure over `{ status, lastMessage }` plus a `Set` of listeners. On the socket's
 * `close` it schedules a reconnect with EXPONENTIAL BACKOFF: attempt N waits
 * `min(base * 2 ** N, max)` (100, 200, 400, … capped). A successful open resets the attempt counter.
 * `getSnapshot` returns a cached object that only changes identity when state changes, so
 * `useSyncExternalStore` never trips its "getSnapshot should be cached" loop guard.
 */
import { useSyncExternalStore } from "react";

export type SocketStatus = "connecting" | "open" | "closed";

/** The minimal transport the store depends on — a real socket.io client or a test fake implements it. */
export interface Socket {
  /** Begin connecting; invoke `onopen` once connected. */
  connect(): void;
  /** Close the connection; invoke `onclose` when it ends. */
  close(): void;
  /** Send an event with a payload to the server. */
  emit(event: string, data: unknown): void;
  /** Subscribe to a server-sent event (e.g. "message"). */
  on(event: string, handler: (data: unknown) => void): void;
  /** Lifecycle callbacks the store assigns. */
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
  return { status: snapshot.status, lastMessage: snapshot.lastMessage, send: store.send };
}
