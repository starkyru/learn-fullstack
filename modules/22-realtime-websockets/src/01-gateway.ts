/**
 * Task 1 — Nest WS gateway (WORKED EXAMPLE).
 *
 * `ChatGateway` below is the fully-solved reference: a socket.io `@WebSocketGateway` that lets a
 * socket `join` a room and `message` broadcasts to everyone in that room via
 * `server.to(room).emit`. Read it — then do YOUR TURN: implement the analog `PresenceGateway`, which
 * tracks who is in a room (`enter`/`leave`) and broadcasts the roster.
 *
 * `@WebSocketServer()` injects the underlying socket.io `Server` so a handler can broadcast beyond
 * the socket that triggered it. Returning a value from a handler sends it back as the event's ACK.
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

export interface ChatMessage {
  room: string;
  from: string;
  text: string;
}

export interface PresenceState {
  room: string;
  users: string[];
}

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  handleConnection(_client: Socket): void {
    // Connection accepted; the client must `join` a room before it will receive broadcasts.
  }

  @SubscribeMessage("join")
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ): { joined: string } {
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() body: ChatMessage): void {
    this.server.to(body.room).emit("message", body);
  }
}

/* ─────────────────────────── YOUR TURN: mirror Chat for Presence ───────────────────────────
 *
 * Track a `room → Set<user>` map. On `enter`: `client.join(room)`, stamp `client.data.room` /
 * `client.data.user`, add the user, and `server.to(room).emit("presence", { room, users })`. On
 * `leave` (and on `handleDisconnect`): remove the user and re-broadcast the roster. Everything below
 * THROWS until you implement it. */

@WebSocketGateway()
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  handleConnection(_client: Socket): void {
    // Nothing until the socket `enter`s a room.
  }

  handleDisconnect(_client: Socket): void {
    throw new Error(
      "TODO: on disconnect, remove the socket's user from its room and re-broadcast presence",
    );
  }

  @SubscribeMessage("enter")
  handleEnter(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _body: { room: string; user: string },
  ): PresenceState {
    throw new Error(
      "TODO: join the room, add the user, and broadcast { room, users } via server.to(room)",
    );
  }

  @SubscribeMessage("leave")
  handleLeave(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _body: { room: string; user: string },
  ): { left: string } {
    throw new Error("TODO: leave the room, remove the user, and re-broadcast presence");
  }
}
