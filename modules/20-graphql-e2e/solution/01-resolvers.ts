/**
 * Task 1 — Code-first Nest GraphQL resolvers (WORKED EXAMPLE).
 *
 * `@ObjectType` classes ARE the schema: `autoSchemaFile: true` reflects the decorator metadata into
 * an in-memory SDL, so the same TypeScript types the server resolves are the types the client will
 * query. `UsersResolver` is the fully-solved reference — a root `@Query` plus a `@ResolveField` that
 * walks `User → [List]`. Read it, then do YOUR TURN in `src/01-resolvers.ts`: implement the analog
 * `CardsResolver` (`@Query cards` + a `@ResolveField list` that walks `Card → List`) so `cards`
 * mirrors `users` field-for-field. That `Card.list` resolver is also where Task 2's N+1 lives.
 */
import { Injectable, Module } from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import {
  Args,
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from "@nestjs/graphql";

@ObjectType()
export class User {
  @Field(() => ID) id!: string;
  @Field() name!: string;
}

@ObjectType()
export class List {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => ID) ownerId!: string;
}

@ObjectType()
export class Card {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => ID) listId!: string;
}

/** In-memory seed — deterministic ids, no `Date.now()`/`Math.random()`. */
@Injectable()
export class DataService {
  readonly users: User[] = [
    { id: "u1", name: "Ada" },
    { id: "u2", name: "Grace" },
  ];
  readonly lists: List[] = [
    { id: "l1", title: "Todo", ownerId: "u1" },
    { id: "l2", title: "Doing", ownerId: "u1" },
    { id: "l3", title: "Done", ownerId: "u2" },
  ];
  readonly cards: Card[] = [
    { id: "c1", title: "Alpha", listId: "l1" },
    { id: "c2", title: "Beta", listId: "l2" },
    { id: "c3", title: "Gamma", listId: "l1" },
  ];

  listsByOwner(ownerId: string): List[] {
    return this.lists.filter((l) => l.ownerId === ownerId);
  }

  listById(id: string): List | null {
    return this.lists.find((l) => l.id === id) ?? null;
  }
}

/* ─────────────────────────── worked example: Users ─────────────────────────── */

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly data: DataService) {}

  @Query(() => [User])
  users(): User[] {
    return this.data.users;
  }

  @Query(() => User, { nullable: true })
  user(@Args("id", { type: () => ID }) id: string): User | null {
    return this.data.users.find((u) => u.id === id) ?? null;
  }

  /** `User.lists` — the nested field the worked-example query walks into. */
  @ResolveField(() => [List])
  lists(@Parent() user: User): List[] {
    return this.data.listsByOwner(user.id);
  }
}

/* ─────────────────────────── analog: Cards (solved here, stub in src) ─────────────────────────── */

@Resolver(() => Card)
export class CardsResolver {
  constructor(private readonly data: DataService) {}

  @Query(() => [Card])
  cards(): Card[] {
    return this.data.cards;
  }

  /** `Card.list` — mirrors `User.lists`, but resolves a single parent list. (Task 2 batches this.) */
  @ResolveField(() => List, { nullable: true })
  list(@Parent() card: Card): List | null {
    return this.data.listById(card.listId);
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [DataService, UsersResolver, CardsResolver],
})
export class GraphqlModule {}
