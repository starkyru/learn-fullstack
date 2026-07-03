import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { BoardsModule } from "./boards/boards.module.js";

/**
 * The root module: `autoSchemaFile: true` builds the schema in memory from the code-first
 * `@ObjectType`/`@Resolver` metadata (no `.graphql` file on disk), then mounts `BoardsModule`.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    BoardsModule,
  ],
})
export class AppModule {}
