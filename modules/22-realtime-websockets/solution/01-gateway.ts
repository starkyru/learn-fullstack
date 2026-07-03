/**
 * Task 1 — Nest WS gateway (WORKED EXAMPLE).
 *
 * `ChatGateway` below is the fully-solved reference: a socket.io `@WebSocketGateway` that lets a
 * socket `join` a room and `message` broadcasts to everyone in that room via
 * `server.to(room).emit`. Read it, then do YOUR TURN in `src/01-gateway.ts` — implement the analog
 * `PresenceGateway`, which tracks who is in a room (`enter`/`leave`) and broadcasts the roster.
 *
 * The gateway is a plain `@Injectable`-style provider whose methods are wired to socket events by
 * `@SubscribeMessage`. `@WebSocketServer()` injects the underlying socket.io `Server` so a handler
 * can broadcast beyond the socket that triggered it. Returning a value from a handler sends it back
 * to the caller as the event's ACK.
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

  /** Called by Nest for every new socket. Nothing to authenticate here (see Task 3 for that). */
  handleConnection(_client: Socket): void {
    // Connection accepted; the client must `join` a room before it will receive broadcasts.
  }

  /** Add the socket to a room; ACK back the room it joined. */
  @SubscribeMessage("join")
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ): { joined: string } {
    client.join(room);
    return { joined: room };
  }

  /** Broadcast the message to everyone currently in its room (including the sender). */
  @SubscribeMessage("message")
  handleMessage(@MessageBody() body: ChatMessage): void {
    this.server.to(body.room).emit("message", body);
  }
}

/* ─────────────────────── analog: Presence (solved here, stub in src) ─────────────────────── */

@WebSocketGateway()
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  /** room → set of user ids currently present. */
  private readonly rooms = new Map<string, Set<string>>();

  handleConnection(_client: Socket): void {
    // Nothing until the socket `enter`s a room.
  }

  /** When a socket drops, remove its user from whatever room it entered and re-broadcast. */
  handleDisconnect(client: Socket): void {
    const room = client.data.room as string | undefined;
    const user = client.data.user as string | undefined;
    if (room && user) this.removeAndBroadcast(room, user);
  }

  @SubscribeMessage("enter")
  handleEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room: string; user: string },
  ): PresenceState {
    client.join(body.room);
    client.data.room = body.room;
    client.data.user = body.user;
    const users = this.rooms.get(body.room) ?? new Set<string>();
    users.add(body.user);
    this.rooms.set(body.room, users);
    const state: PresenceState = { room: body.room, users: [...users] };
    this.server.to(body.room).emit("presence", state);
    return state;
  }

  @SubscribeMessage("leave")
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room: string; user: string },
  ): { left: string } {
    client.leave(body.room);
    this.removeAndBroadcast(body.room, body.user);
    return { left: body.room };
  }

  private removeAndBroadcast(room: string, user: string): void {
    const users = this.rooms.get(room);
    if (!users) return;
    users.delete(user);
    this.server
      .to(room)
      .emit("presence", { room, users: [...users] } satisfies PresenceState);
  }
}
