import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { BoardsModule } from "./boards/boards.module.js";

/**
 * The root module: `autoSchemaFile: true` builds the schema in memory from the code-first
 * `@ObjectType`/`@Resolver` metadata (no `.graphql` file on disk), then mounts `BoardsModule`.
 *
 * `graphiql` serves the maintained GraphiQL explorer at GET /graphql in dev, replacing the
 * deprecated `@apollo/server-plugin-landing-page-graphql-playground` that `@nestjs/apollo` would
 * otherwise mount by default. Gated off in production so the explorer/introspection UI isn't exposed.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      graphiql: process.env.NODE_ENV !== "production",
    }),
    BoardsModule,
  ],
})
export class AppModule {}
