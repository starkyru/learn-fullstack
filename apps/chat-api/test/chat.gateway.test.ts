import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket as ClientSocket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ChatGateway, type ChatMessage } from "../src/chat.gateway.js";

/** Resolve once `event` fires, rejecting if it does not arrive within `ms` (keeps a hang from stalling CI). */
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

/** Emit an event the gateway ACKs, awaiting the ACK before continuing. */
function emitAck(socket: ClientSocket, event: string, data: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    socket.emit(event, data, resolve);
  });
}

describe("ChatGateway — socket.io join + room broadcast on an ephemeral port", () => {
  let app: INestApplication;
  let port: number;
  let alice: ClientSocket;
  let bob: ClientSocket;

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ providers: [ChatGateway] }).compile();
    app = ref.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    port = (app.getHttpServer().address() as AddressInfo).port;

    const connect = (): ClientSocket =>
      io(`http://127.0.0.1:${port}`, {
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
      });
    alice = connect();
    bob = connect();
    await Promise.all([once(alice, "connect"), once(bob, "connect")]);
  });

  afterAll(async () => {
    alice.disconnect();
    bob.disconnect();
    await app.close();
  });

  it("join ACKs the room it joined", async () => {
    expect(await emitAck(alice, "join", "room-1")).toEqual({ joined: "room-1" });
  });

  it("delivers one client's broadcast to another client in the same room, with the exact payload", async () => {
    await Promise.all([emitAck(alice, "join", "room-1"), emitAck(bob, "join", "room-1")]);

    const bobReceives = once<ChatMessage>(bob, "message");
    const sent: ChatMessage = { room: "room-1", from: "alice", text: "hello bob" };
    alice.emit("message", sent);

    expect(await bobReceives).toEqual(sent);
  });

  it("does NOT deliver to a client subscribed to a different room", async () => {
    await Promise.all([emitAck(alice, "join", "room-a"), emitAck(bob, "join", "room-b")]);

    let bobGot = false;
    bob.on("message", () => {
      bobGot = true;
    });
    // alice is in room-a, so she receives her own broadcast — await it to flush the fan-out.
    const echo = once<ChatMessage>(alice, "message");
    alice.emit("message", { room: "room-a", from: "alice", text: "only room-a" });
    await echo;

    expect(bobGot).toBe(false);
  });
});
