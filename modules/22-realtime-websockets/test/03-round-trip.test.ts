import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthChatGateway,
  TOKEN_VERIFIER,
  type OutboundMessage,
  type TokenVerifier,
} from "../solution/03-round-trip.js";

/** Maps demo tokens to user ids; everything else is invalid. The gateway trusts THIS, not the client. */
const verifier: TokenVerifier = {
  verify(token: unknown): string | null {
    if (token === "t-alice") return "alice";
    if (token === "t-bob") return "bob";
    return null;
  },
};

function once<T = unknown>(socket: ClientSocket, event: string, ms = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout waiting for "${event}"`)),
      ms,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function emitAck(socket: ClientSocket, event: string, data: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    socket.emit(event, data, resolve);
  });
}

describe("Task 3 — End-to-end round trip with socket auth", () => {
  let app: INestApplication;
  let port: number;
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    const ref = await Test.createTestingModule({
      providers: [AuthChatGateway, { provide: TOKEN_VERIFIER, useValue: verifier }],
    }).compile();
    app = ref.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    port = (app.getHttpServer().address() as AddressInfo).port;
  });

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    clients.length = 0;
    await app.close();
  });

  function connect(token: unknown): ClientSocket {
    const client = io(`http://127.0.0.1:${port}`, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
      auth: { token },
    });
    clients.push(client);
    return client;
  }

  it("rejects an unauthenticated socket with an 'unauthorized' event and disconnect", async () => {
    const intruder = connect("nope");
    const unauthorized = once<{ message: string }>(intruder, "unauthorized");
    const disconnected = once(intruder, "disconnect");

    expect(await unauthorized).toEqual({ message: "Invalid or missing token" });
    await disconnected;
    expect(intruder.connected).toBe(false);
  });

  it("rejects a socket with NO token at all", async () => {
    const intruder = connect(undefined);
    expect(await once<{ message: string }>(intruder, "unauthorized")).toEqual({
      message: "Invalid or missing token",
    });
  });

  it("accepts a valid token and completes a two-client round trip with the SERVER-verified sender", async () => {
    const alice = connect("t-alice");
    const bob = connect("t-bob");
    await Promise.all([once(alice, "connect"), once(bob, "connect")]);
    await Promise.all([emitAck(alice, "join", "room-1"), emitAck(bob, "join", "room-1")]);

    const bobReceives = once<OutboundMessage>(bob, "message");
    // Client sends only { room, text }; the gateway stamps `from` from the verified token.
    alice.emit("message", { room: "room-1", text: "hello bob" });

    expect(await bobReceives).toEqual({
      room: "room-1",
      from: "alice",
      text: "hello bob",
    });
  });

  it("does not leak messages to authenticated clients in other rooms", async () => {
    const alice = connect("t-alice");
    const bob = connect("t-bob");
    await Promise.all([once(alice, "connect"), once(bob, "connect")]);
    await Promise.all([emitAck(alice, "join", "room-1"), emitAck(bob, "join", "room-2")]);

    let bobGot = false;
    bob.on("message", () => {
      bobGot = true;
    });
    const echo = once(alice, "message");
    alice.emit("message", { room: "room-1", text: "for room-1 only" });
    await echo;

    expect(bobGot).toBe(false);
  });
});
