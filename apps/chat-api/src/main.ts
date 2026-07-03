/**
 * Bootstrap for the Chat API (Pulse) — NOT gated (no `next build` / running server at gate time).
 *
 * Creates the Nest app, swaps in the socket.io WebSocket adapter so `ChatGateway` speaks socket.io,
 * and listens. Run it with `pnpm --filter @learn-fullstack/chat-api dev`.
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ChatModule } from "./chat.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ChatModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const port = Number(process.env["PORT"] ?? 3001);
  await app.listen(port);

  console.log(`chat-api listening on http://localhost:${port}`);
}

void bootstrap();
