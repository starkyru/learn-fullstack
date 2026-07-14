// Runtime bootstrap — NOT part of the test gate (no listening server is started at gate time).
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? "3000";
  await app.listen(port);
  // GraphQL endpoint at http://localhost:<port>/graphql (GraphiQL explorer in dev; see app.module.ts)
}

void bootstrap();
