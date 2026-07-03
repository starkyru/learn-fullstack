/**
 * Task 4 — SSE & GraphQL-subscription alternatives (EXT — src mirrors this file exactly).
 *
 * The same "feed" delivered three ways so you can compare. A `FeedHub` is the source of truth (a
 * tiny pub/sub). `createSseServer` streams it as `text/event-stream` over a plain Node HTTP server;
 * `feedIterator` exposes it as a GraphQL-style async iterator via `graphql-subscriptions`. The
 * exported `REALTIME_TRADEOFFS` note compares WebSockets vs SSE vs GraphQL subscriptions.
 */
import http from "node:http";
import { PubSub } from "graphql-subscriptions";

export interface FeedEvent {
  id: number;
  text: string;
}

/** A minimal in-memory pub/sub — the shared source of truth for both transports below. */
export class FeedHub {
  private readonly listeners = new Set<(event: FeedEvent) => void>();

  subscribe(listener: (event: FeedEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: FeedEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }

  get size(): number {
    return this.listeners.size;
  }
}

/**
 * SSE transport. A GET to `/feed` opens a `text/event-stream` and writes one SSE frame per feed
 * event (`id:`, `event:`, `data:` lines terminated by a blank line). Unsubscribes when the client
 * disconnects so nothing leaks.
 */
export function createSseServer(hub: FeedHub): http.Server {
  return http.createServer((req, res) => {
    if (req.url !== "/feed") {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    // Flush headers NOW: with no body written yet, Node buffers the header until the first
    // `res.write`, so a client that waits for the response before triggering an event would
    // deadlock. `flushHeaders()` sends the status line + headers immediately (as SSE requires).
    res.flushHeaders();
    const unsubscribe = hub.subscribe((event) => {
      res.write(`id: ${event.id}\nevent: message\ndata: ${JSON.stringify(event)}\n\n`);
    });
    req.on("close", unsubscribe);
  });
}

/** Parse an SSE wire chunk into structured frames — the inverse of what `createSseServer` writes. */
export interface SseFrame {
  id: string;
  event: string;
  data: FeedEvent;
}

export function parseSseFrames(raw: string): SseFrame[] {
  return raw
    .split("\n\n")
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const fields: Record<string, string> = {};
      for (const line of block.split("\n")) {
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        fields[key] = line.slice(idx + 1).trim();
      }
      return {
        id: fields.id ?? "",
        event: fields.event ?? "",
        data: JSON.parse(fields.data ?? "null") as FeedEvent,
      };
    });
}

/* ─────────────────────── GraphQL-subscription equivalent ─────────────────────── */

export const FEED_TOPIC = "FEED";

export function createFeedPubSub(): PubSub {
  return new PubSub();
}

export function publishFeed(pubsub: PubSub, event: FeedEvent): Promise<void> {
  return pubsub.publish(FEED_TOPIC, event);
}

/**
 * The subscription resolver's `subscribe` returns this async iterator; each `next()` resolves with
 * the next published `FeedEvent` — exactly what a `@Subscription` field yields under the hood.
 */
export function feedIterator(pubsub: PubSub): AsyncIterableIterator<FeedEvent> {
  return pubsub.asyncIterableIterator<FeedEvent>(FEED_TOPIC);
}

/* ─────────────────────── the tradeoff note ─────────────────────── */

export const REALTIME_TRADEOFFS = `WebSocket vs SSE vs GraphQL subscription — when to use which:

- WebSocket (this module's gateway): full-duplex over one TCP connection. Pick it when the CLIENT
  must push too (chat, presence, collaborative editing, multiplayer). Cost: a stateful connection to
  scale, its own auth/reconnect story, and a non-HTTP protocol some proxies mishandle.
- SSE (Server-Sent Events): one-way server→client over plain HTTP (text/event-stream). Pick it for
  server-push-only feeds (notifications, live scores, log tails). Cheap: it's just HTTP, so it rides
  existing auth/proxies/HTTP2 and auto-reconnects with Last-Event-ID. Limits: server→client only, and
  browsers cap concurrent connections per origin on HTTP/1.1.
- GraphQL subscription: a typed, schema-first push channel (usually transported over a WebSocket).
  Pick it when you already speak GraphQL and want subscriptions to share types/auth/tooling with your
  queries and mutations. Cost: the WebSocket operational burden plus GraphQL server machinery.

Rule of thumb: bidirectional → WebSocket; one-way push on plain HTTP → SSE; already-GraphQL and want
typed push → GraphQL subscription (over a WebSocket).`;
