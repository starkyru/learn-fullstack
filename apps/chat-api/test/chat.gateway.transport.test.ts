import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket as ClientSocket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ChatGateway } from "../src/chat.gateway.js";

/**
 * Socket.IO transport coverage for the Nest 11 realtime stack.
 *
 * The main gateway test (`chat.gateway.test.ts`) forces `transports: ["websocket"]`, which skips
 * Engine.IO's HTTP long-poll transport entirely. This test pins `transports: ["polling"]` so the whole
 * session runs on long-poll, asserting the handshake and ack round-trip still work — a regression in
 * that HTTP path (which runs on the same Node HTTP server the Nest 11 app boots) fails the gate instead
 * of hiding behind a forced websocket.
 *
 * Scope note: Engine.IO intercepts `/socket.io/*` on the raw HTTP server before Nest's Express router,
 * so this covers the Socket.IO transport, not Express 5 middleware — the Express 5 REST request
 * pipeline is covered by `chat.controller.test.ts` (supertest through the full Nest/Express-5 app).
 */
describe("ChatGateway — socket.io HTTP long-poll transport", () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ providers: [ChatGateway] }).compile();
    app = ref.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterAll(async () => {
    await app.close();
  });

  it("connects and ACKs a join over the HTTP long-poll transport (no websocket)", async () => {
    // Pin `transports: ["polling"]` so the whole session runs on Engine.IO's HTTP long-poll — the
    // path a forced-websocket client never touches. This is deterministic (no upgrade race) and
    // proves the polling handshake + ack round-trip still work on the Nest 11 HTTP server.
    const client: ClientSocket = io(`http://127.0.0.1:${port}`, {
      transports: ["polling"],
      upgrade: false,
      forceNew: true,
      reconnection: false,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout: no connect")), 3000);
        client.on("connect_error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
        client.on("connect", () => {
          clearTimeout(timer);
          resolve();
        });
      });
      // The session must actually be on polling, not a silent fallback to websocket.
      const engine = (client.io as unknown as { engine: EngineLike }).engine;
      expect(engine.transport.name).toBe("polling");

      const ack = await new Promise((resolve) => client.emit("join", "room-x", resolve));
      expect(ack).toEqual({ joined: "room-x" });
    } finally {
      client.disconnect();
    }
  });
});

/** Minimal shape of the engine.io transport surface this test reads. */
interface EngineLike {
  transport: { name: string };
}
