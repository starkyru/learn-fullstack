/**
 * Task 3 — End-to-end round trip (TODO).
 *
 * Wire the client-emit → gateway → broadcast → other-clients path, WITH socket auth. On connection,
 * read the handshake token and ask the INJECTED `TokenVerifier` to resolve it to a user id; reject
 * (emit `unauthorized` + `disconnect`) when it returns `null`, otherwise stamp the user id on
 * `socket.data`. `message` broadcasts to the room stamping the SERVER-verified `from`.
 *
 * Keep the signatures; implement the bodies (they throw until you do).
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

export const TOKEN_VERIFIER = "TOKEN_VERIFIER";

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

  handleConnection(_client: Socket): void {
    throw new Error(
      "TODO: verify handshake.auth.token; on null emit 'unauthorized' + disconnect(true), else stamp socket.data.userId",
    );
  }

  @SubscribeMessage("join")
  handleJoin(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _room: string,
  ): { joined: string } {
    throw new Error("TODO: client.join(room) and ACK { joined: room }");
  }

  @SubscribeMessage("message")
  handleMessage(
    @ConnectedSocket() _client: Socket,
    @MessageBody() _body: { room: string; text: string },
  ): void {
    throw new Error(
      "TODO: broadcast { room, from: socket.data.userId, text } to the room via server.to(room)",
    );
  }
}
