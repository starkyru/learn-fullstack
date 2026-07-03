/**
 * `ChatController` — the REST half of the slice, guarded end-to-end by `JwtAuthGuard`.
 *
 *   GET  /rooms/:id/messages  → 200, the room's message history
 *   POST /rooms/:id/messages  → 201, appends `{ text }` as a message whose `from` is the
 *                                SERVER-verified `sub` (never trusted from the client body)
 *
 * `@UseGuards(JwtAuthGuard)` on the class means both routes 401 without a valid bearer token.
 */
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type RequestWithUser } from "./jwt-auth.guard.js";
import { MessageService, type Message } from "./message.service.js";

@Controller("rooms")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly messages: MessageService) {}

  @Get(":id/messages")
  list(@Param("id") room: string): Message[] {
    return this.messages.list(room);
  }

  @Post(":id/messages")
  create(
    @Param("id") room: string,
    @Body() body: { text: string },
    @Req() req: RequestWithUser,
  ): Message {
    const from = req.user?.sub ?? "";
    return this.messages.add(room, from, body.text);
  }
}
