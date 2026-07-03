/**
 * Code-first GraphQL object types for the Kanban (Trellix) domain.
 *
 * These `@ObjectType` classes ARE the schema: `autoSchemaFile: true` (see `app.module.ts`) reflects
 * this decorator metadata into an in-memory SDL, so the exact TypeScript shapes the resolver returns
 * are the shapes a client can query. A `Board` owns `Column`s; each `Column` owns `Card`s; the
 * `owner` reuses the shared wire-contract `User` shape from `@learn-fullstack/shared`.
 */
import { Field, ID, ObjectType } from "@nestjs/graphql";

/** Mirrors `@learn-fullstack/shared`'s `User` (id/email/nullable name) as a GraphQL type. */
@ObjectType()
export class BoardOwner {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field(() => String, { nullable: true }) name!: string | null;
}

@ObjectType()
export class Card {
  @Field(() => ID) id!: string;
  @Field(() => ID) columnId!: string;
  @Field() title!: string;
}

@ObjectType()
export class Column {
  @Field(() => ID) id!: string;
  @Field(() => ID) boardId!: string;
  @Field() title!: string;
  @Field(() => [Card]) cards!: Card[];
}

@ObjectType()
export class Board {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() name!: string;
  @Field(() => BoardOwner) owner!: BoardOwner;
  @Field(() => [Column]) columns!: Column[];
}
