/**
 * `ChatGateway` — the realtime half of the slice (socket.io via `@nestjs/platform-socket.io`).
 *
 *   `join`    → the socket subscribes to a room; ACKs `{ joined }`.
 *   `message` → broadcasts the payload to everyone currently in its room (including the sender).
 *
 * `@WebSocketServer()` injects the underlying socket.io `Server` so a handler can fan out beyond the
 * one socket that triggered it. Milestone note: M3 adds a socket handshake `JwtAuthGuard` (verify the
 * token in `handshake.auth` on connect) and stamps `from` from the verified `sub` instead of trusting
 * the payload — the same server-verified-sender pattern the REST POST already uses.
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

export interface ChatMessage {
  room: string;
  from: string;
  text: string;
}

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server!: Server;

  /** Subscribe the socket to `room`; ACK back the room it joined. */
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
