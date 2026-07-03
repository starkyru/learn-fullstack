/**
 * Task 2 — `useSocket` client (FROM SCRATCH).
 *
 * Build a reconnecting socket store + a `useSocket` hook on `useSyncExternalStore`. The store is
 * framework-agnostic: it talks to the `Socket` interface (not socket.io directly) and schedules
 * reconnects through an INJECTED `Scheduler`, so tests drive it with a fake socket + fake clock.
 *
 * YOUR TURN — implement `createSocketStore` and `useSocket`:
 *   - closure over `{ status, lastMessage }` + a `Set` of listeners; a cached snapshot object whose
 *     identity changes only when state changes (so `useSyncExternalStore` doesn't loop).
 *   - `spawn()`: create a socket, wire `onopen` → status "open" (reset attempt), `onclose` → status
 *     "closed" then reconnect, `on(messageEvent)` → update lastMessage; then `connect()`.
 *   - `scheduleReconnect()`: EXPONENTIAL BACKOFF `min(base * 2 ** attempt, max)` via the scheduler,
 *     then bump attempt (delays 100, 200, 400, … capped at max).
 *   - `useSocket`: `useSyncExternalStore(subscribe, getSnapshot, getSnapshot)` → `{ status,
 *     lastMessage, send }`.
 */
import { useSyncExternalStore } from "react";

export type SocketStatus = "connecting" | "open" | "closed";

export interface Socket {
  connect(): void;
  close(): void;
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
}

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
  close(): void;
}

export interface SocketStoreOptions {
  createSocket: () => Socket;
  scheduler: Scheduler;
  baseDelay?: number;
  maxDelay?: number;
  messageEvent?: string;
}

export function createSocketStore(_options: SocketStoreOptions): SocketStore {
  throw new Error(
    "TODO: build the reconnecting store (status/lastMessage/listeners, backoff via scheduler)",
  );
}

export interface UseSocketResult {
  status: SocketStatus;
  lastMessage: unknown;
  send: (event: string, data: unknown) => void;
}

export function useSocket(_store: SocketStore): UseSocketResult {
  // Keep the hook call so the shape is right; replace the body with the real binding.
  useSyncExternalStore(
    () => () => {},
    (): SocketSnapshot => {
      throw new Error("TODO: return the store snapshot");
    },
    (): SocketSnapshot => {
      throw new Error("TODO: return the store snapshot");
    },
  );
  throw new Error("TODO: return { status, lastMessage, send }");
}
