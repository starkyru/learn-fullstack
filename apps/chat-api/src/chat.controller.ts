/**
 * `ChatController` — the REST half of the slice, guarded end-to-end by `JwtAuthGuard`.
 *
 *   GET  /rooms/:id/messages  → 200, the room's message history
 *   POST /rooms/:id/messages  → 201, appends `{ text }` as a message whose `from` is the
 *                                SERVER-verified `sub` (never trusted from the client body)
 *
 * `@UseGuards(JwtAuthGuard)` on the class means both routes 401 without a valid bearer token.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard, type RequestWithUser } from "./jwt-auth.guard.js";
import { MessageService, type Message } from "./message.service.js";

/** Upper bound on a single message body, to cap what an authenticated client can store per request. */
const MAX_MESSAGE_LENGTH = 4000;

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
    // Validate `text` at the boundary: `@Body()`'s type is erased at runtime, so without this a
    // client could send `{ "text": { … } }` (JSON) or a mixed form-urlencoded key and get a
    // non-string persisted, breaking `Message.text: string`. (The class-validator/DTO version of
    // this is chat-api milestone M4; this is the minimal defensive check.)
    const text = body?.text;
    if (typeof text !== "string" || text.trim() === "") {
      throw new BadRequestException("`text` must be a non-empty string");
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `\`text\` must be at most ${MAX_MESSAGE_LENGTH} characters`,
      );
    }
    const from = req.user?.sub ?? "";
    return this.messages.add(room, from, text);
  }
}
