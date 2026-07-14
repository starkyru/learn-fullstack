import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { BoardsModule } from "./boards/boards.module.js";
import { graphqlDevToolsEnabled } from "./graphql-devtools.js";

/**
 * The root module: `autoSchemaFile: true` builds the schema in memory from the code-first
 * `@ObjectType`/`@Resolver` metadata (no `.graphql` file on disk), then mounts `BoardsModule`.
 *
 * `graphiql`/`introspection` follow the default-deny policy in `graphql-devtools.ts` (only an explicit
 * `development`/`test` env enables them). `playground: false` is required for that to hold: left
 * undefined, `@nestjs/apollo` mounts its deprecated graphql-playground fallback for any non-`production`
 * NODE_ENV even when `graphiql` is false — setting it false routes every non-dev env to the disabled
 * landing page (and keeps that deprecated plugin uninstantiated).
 */
const devTools = graphqlDevToolsEnabled(process.env.NODE_ENV);

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      graphiql: devTools,
      introspection: devTools,
      playground: false,
    }),
    BoardsModule,
  ],
})
export class AppModule {}
