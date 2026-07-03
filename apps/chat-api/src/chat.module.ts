/**
 * `ChatModule` — wires the slice together with Nest DI.
 *
 * The secret + clock are provided here as real runtime values (secret from `JWT_SECRET` env, a
 * system clock). Tests build the SAME module and `.overrideProvider(...)` both with a fixed secret +
 * frozen clock so token verification is deterministic — the module never bakes test constants in.
 */
import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller.js";
import { ChatGateway } from "./chat.gateway.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { ID_SOURCE, MessageService, SeqIdSource } from "./message.service.js";
import { CLOCK, JWT_SECRET, systemClock } from "./tokens.js";

/** Dev fallback secret — a real deploy MUST set `JWT_SECRET` (M6, TODO: fail fast if unset in prod). */
const DEV_SECRET = "dev-chat-secret-please-override-000000";

@Module({
  controllers: [ChatController],
  providers: [
    MessageService,
    { provide: ID_SOURCE, useClass: SeqIdSource },
    ChatGateway,
    JwtAuthGuard,
    {
      provide: JWT_SECRET,
      useFactory: (): Uint8Array =>
        new TextEncoder().encode(process.env["JWT_SECRET"] ?? DEV_SECRET),
    },
    { provide: CLOCK, useValue: systemClock },
  ],
})
export class ChatModule {}
