import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import {
  createFeedPubSub,
  createSseServer,
  feedIterator,
  FeedHub,
  parseSseFrames,
  publishFeed,
  REALTIME_TRADEOFFS,
  type SseFrame,
} from "../solution/04-sse-graphql-alt.js";

describe("Task 4 — FeedHub (shared source of truth)", () => {
  it("delivers published events to subscribers and stops after unsubscribe", () => {
    const hub = new FeedHub();
    const seen: number[] = [];
    const off = hub.subscribe((event) => seen.push(event.id));
    expect(hub.size).toBe(1);

    hub.publish({ id: 1, text: "a" });
    hub.publish({ id: 2, text: "b" });
    off();
    hub.publish({ id: 3, text: "c" });

    expect(seen).toEqual([1, 2]);
    expect(hub.size).toBe(0);
  });
});

describe("Task 4 — SSE transport", () => {
  let server: http.Server | undefined;
  let req: http.ClientRequest | undefined;

  afterEach(async () => {
    req?.destroy();
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
  });

  function collectFrames(res: http.IncomingMessage, count: number): Promise<SseFrame[]> {
    return new Promise<SseFrame[]>((resolve, reject) => {
      let buffer = "";
      const timer = setTimeout(
        () => reject(new Error("timeout collecting SSE frames")),
        2000,
      );
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        buffer += chunk;
        // Only parse COMPLETE frames (up to the last blank-line boundary) so a chunk that splits
        // mid-frame never reaches JSON.parse.
        const lastBoundary = buffer.lastIndexOf("\n\n");
        if (lastBoundary === -1) return;
        const frames = parseSseFrames(buffer.slice(0, lastBoundary + 2));
        if (frames.length >= count) {
          clearTimeout(timer);
          resolve(frames);
        }
      });
      res.on("error", reject);
    });
  }

  it("streams published feed events as text/event-stream frames", async () => {
    const hub = new FeedHub();
    server = createSseServer(hub);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const { port } = server.address() as AddressInfo;

    const res = await new Promise<http.IncomingMessage>((resolve) => {
      req = http.get({ port, path: "/feed" }, resolve);
    });
    expect(res.headers["content-type"]).toBe("text/event-stream");

    const framesPromise = collectFrames(res, 2);
    hub.publish({ id: 1, text: "first" });
    hub.publish({ id: 2, text: "second" });

    expect(await framesPromise).toEqual([
      { id: "1", event: "message", data: { id: 1, text: "first" } },
      { id: "2", event: "message", data: { id: 2, text: "second" } },
    ]);
  });

  it("404s a path other than /feed", async () => {
    const hub = new FeedHub();
    server = createSseServer(hub);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const { port } = server.address() as AddressInfo;

    const status = await new Promise<number>((resolve) => {
      req = http.get({ port, path: "/nope" }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
    });
    expect(status).toBe(404);
  });
});

describe("Task 4 — GraphQL-subscription equivalent", () => {
  it("yields each published event from the async iterator in order", async () => {
    const pubsub = createFeedPubSub();
    const iterator = feedIterator(pubsub);

    const first = iterator.next();
    await publishFeed(pubsub, { id: 1, text: "first" });
    expect((await first).value).toEqual({ id: 1, text: "first" });

    const second = iterator.next();
    await publishFeed(pubsub, { id: 2, text: "second" });
    expect((await second).value).toEqual({ id: 2, text: "second" });

    await iterator.return?.(undefined);
  });
});

describe("Task 4 — tradeoff note", () => {
  it("compares all three transports and states the bidirectional rule", () => {
    expect(REALTIME_TRADEOFFS).toContain("WebSocket");
    expect(REALTIME_TRADEOFFS).toContain("SSE");
    expect(REALTIME_TRADEOFFS).toContain("GraphQL subscription");
    expect(REALTIME_TRADEOFFS).toContain("bidirectional → WebSocket");
  });
});
