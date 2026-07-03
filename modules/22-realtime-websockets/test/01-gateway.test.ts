import type { AddressInfo } from "node:net";
import type { INestApplication, Type } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ChatGateway,
  PresenceGateway,
  type PresenceState,
} from "../solution/01-gateway.js";

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

/** Emit an event that the gateway ACKs, awaiting the ACK before continuing. */
function emitAck(socket: ClientSocket, event: string, data: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    socket.emit(event, data, resolve);
  });
}

describe("Task 1 — Nest WS gateway", () => {
  let app: INestApplication;
  let port: number;
  const clients: ClientSocket[] = [];

  async function start(GatewayClass: Type<unknown>): Promise<void> {
    const ref = await Test.createTestingModule({
      providers: [GatewayClass],
    }).compile();
    app = ref.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    port = (app.getHttpServer().address() as AddressInfo).port;
  }

  function connect(): ClientSocket {
    const client = io(`http://127.0.0.1:${port}`, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });
    clients.push(client);
    return client;
  }

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    clients.length = 0;
    await app.close();
  });

  describe("chat (worked example)", () => {
    beforeEach(() => start(ChatGateway));

    it("broadcasts a room message to the OTHER client with the exact payload", async () => {
      const alice = connect();
      const bob = connect();
      await Promise.all([once(alice, "connect"), once(bob, "connect")]);
      await Promise.all([emitAck(alice, "join", "r1"), emitAck(bob, "join", "r1")]);

      const received = once(bob, "message");
      alice.emit("message", { room: "r1", from: "alice", text: "hi bob" });

      expect(await received).toEqual({ room: "r1", from: "alice", text: "hi bob" });
    });

    it("join ACKs the room it joined", async () => {
      const alice = connect();
      await once(alice, "connect");
      expect(await emitAck(alice, "join", "lobby")).toEqual({ joined: "lobby" });
    });

    it("does NOT deliver to a client in a different room", async () => {
      const alice = connect();
      const bob = connect();
      await Promise.all([once(alice, "connect"), once(bob, "connect")]);
      await Promise.all([emitAck(alice, "join", "r1"), emitAck(bob, "join", "r2")]);

      let bobGot = false;
      bob.on("message", () => {
        bobGot = true;
      });
      const echo = once(alice, "message"); // alice is in r1, so she receives her own broadcast
      alice.emit("message", { room: "r1", from: "alice", text: "only r1" });
      await echo;

      expect(bobGot).toBe(false);
    });
  });

  describe("presence (your analog)", () => {
    beforeEach(() => start(PresenceGateway));

    it("broadcasts the growing roster as users enter", async () => {
      const alice = connect();
      const bob = connect();
      await Promise.all([once(alice, "connect"), once(bob, "connect")]);

      const aliceEnter = (await emitAck(alice, "enter", {
        room: "g",
        user: "alice",
      })) as PresenceState;
      expect(aliceEnter).toEqual({ room: "g", users: ["alice"] });

      const aliceSeesBob = once<PresenceState>(alice, "presence");
      const bobEnter = (await emitAck(bob, "enter", {
        room: "g",
        user: "bob",
      })) as PresenceState;

      expect(bobEnter).toEqual({ room: "g", users: ["alice", "bob"] });
      expect(await aliceSeesBob).toEqual({ room: "g", users: ["alice", "bob"] });
    });

    it("re-broadcasts the roster when a user leaves", async () => {
      const alice = connect();
      const bob = connect();
      await Promise.all([once(alice, "connect"), once(bob, "connect")]);
      await emitAck(alice, "enter", { room: "g", user: "alice" });
      await emitAck(bob, "enter", { room: "g", user: "bob" });

      const aliceSeesLeave = once<PresenceState>(alice, "presence");
      await emitAck(bob, "leave", { room: "g", user: "bob" });

      expect(await aliceSeesLeave).toEqual({ room: "g", users: ["alice"] });
    });

    it("drops a user from the roster on disconnect", async () => {
      const alice = connect();
      const bob = connect();
      await Promise.all([once(alice, "connect"), once(bob, "connect")]);
      await emitAck(alice, "enter", { room: "g", user: "alice" });
      await emitAck(bob, "enter", { room: "g", user: "bob" });

      const aliceSeesDrop = once<PresenceState>(alice, "presence");
      bob.disconnect();

      expect(await aliceSeesDrop).toEqual({ room: "g", users: ["alice"] });
    });

    it("scopes presence to the entering user's room — a different-room client never hears it", async () => {
      const alice = connect();
      const carol = connect();
      const bob = connect();
      await Promise.all([
        once(alice, "connect"),
        once(carol, "connect"),
        once(bob, "connect"),
      ]);

      // Two distinct rooms: carol in r1, bob in r2.
      await emitAck(carol, "enter", { room: "r1", user: "carol" });
      await emitAck(bob, "enter", { room: "r2", user: "bob" });

      // bob (r2) must NEVER receive an r1 presence broadcast.
      let bobHeardR1 = false;
      bob.on("presence", (state: PresenceState) => {
        if (state.room === "r1") bobHeardR1 = true;
      });

      // ENTER: alice joins r1 → only same-room clients (carol) get the presence event.
      const carolSeesEnter = once<PresenceState>(carol, "presence");
      await emitAck(alice, "enter", { room: "r1", user: "alice" });
      expect(await carolSeesEnter).toEqual({ room: "r1", users: ["carol", "alice"] });

      // LEAVE: alice leaves r1 → the re-broadcast stays scoped to r1.
      const carolSeesLeave = once<PresenceState>(carol, "presence");
      await emitAck(alice, "leave", { room: "r1", user: "alice" });
      expect(await carolSeesLeave).toEqual({ room: "r1", users: ["carol"] });

      // Flush bob's inbound queue: per-socket ordering guarantees any r1 broadcast wrongly
      // sent globally to bob is delivered before this ACK returns.
      await emitAck(bob, "leave", { room: "r2", user: "bob" });
      expect(bobHeardR1).toBe(false);
    });
  });
});
