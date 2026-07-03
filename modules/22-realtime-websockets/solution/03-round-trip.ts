/**
 * Task 3 — End-to-end round trip (SOLUTION).
 *
 * Wire the client-emit → gateway → broadcast → other-clients path, WITH socket auth. On connection
 * the gateway reads the handshake token and asks an INJECTED `TokenVerifier` to resolve it to a user
 * id; an invalid token gets an `unauthorized` event and is disconnected, a valid one is accepted and
 * its user id is stamped onto `socket.data`. `message` then broadcasts to the room stamping the
 * SERVER-verified `from` (never trusting a client-supplied identity).
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
} from "@nestjs/websockets";
import { Inject } from "@nestjs/common";
import type { Server, Socket } from "socket.io";

/** DI token for the auth boundary (interfaces vanish at runtime). */
export const TOKEN_VERIFIER = "TOKEN_VERIFIER";

/** Resolves a handshake token to a user id, or `null` when the token is invalid. */
export interface TokenVerifier {
  verify(token: unknown): string | null;
}

export interface OutboundMessage {
  room: string;
  from: string;
  text: string;
}

@WebSocketGateway()
export class AuthChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(@Inject(TOKEN_VERIFIER) private readonly tokens: TokenVerifier) {}

  handleConnection(client: Socket): void {
    const token = (client.handshake.auth as { token?: unknown } | undefined)?.token;
    const userId = this.tokens.verify(token);
    if (userId === null) {
      client.emit("unauthorized", { message: "Invalid or missing token" });
      client.disconnect(true);
      return;
    }
    client.data.userId = userId;
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
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room: string; text: string },
  ): void {
    const from = client.data.userId as string;
    const payload: OutboundMessage = { room: body.room, from, text: body.text };
    this.server.to(body.room).emit("message", payload);
  }
}
