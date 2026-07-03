/**
 * Task 3 — Mutations + subscriptions with an auth context.
 *
 * `addCard` mutates in-memory state and PUBLISHES the new card to a `graphql-subscriptions` `PubSub`;
 * `cardAdded` is a `@Subscription` that returns that pub/sub's async iterator, so a client subscribed
 * to `cardAdded` receives every card a later `addCard` creates. `GqlAuthGuard` reads the GraphQL
 * context's request headers and rejects an unauthenticated `addCard` — auth lives in the request
 * context, exactly like a real resolver-level guard.
 *
 * Determinism: the new card's id comes from an INJECTED `IdSource` (a seq counter), never
 * `Date.now()`/`Math.random()`.
 */
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Module,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import {
  Args,
  Field,
  GqlExecutionContext,
  GraphQLModule,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Subscription,
} from "@nestjs/graphql";
import { PubSub } from "graphql-subscriptions";

@ObjectType()
export class Card {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => ID) listId!: string;
}

@InputType()
export class AddCardInput {
  @Field() title!: string;
  @Field(() => ID) listId!: string;
}

/** Injectable, deterministic id source (seq counter). */
export interface IdSource {
  next(): string;
}
export const ID_SOURCE = "ID_SOURCE";

@Injectable()
export class SeqIdSource implements IdSource {
  private n = 0;
  next(): string {
    return String(++this.n);
  }
}

export const PUB_SUB = "PUB_SUB";
/** The event name the subscription and the mutation agree on. */
export const CARD_ADDED = "cardAdded";

@Injectable()
export class CardStore {
  private readonly cards: Card[] = [];
  add(card: Card): void {
    this.cards.push(card);
  }
  all(): Card[] {
    return this.cards;
  }
}

/**
 * A resolver-level guard: pull the request off the GraphQL context and require an `authorization`
 * header. Throws `UnauthorizedException` (→ a GraphQL error) when missing.
 */
@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{
      req?: { headers?: Record<string, string | undefined> };
    }>().req;
    const auth = req?.headers?.authorization;
    if (!auth) throw new UnauthorizedException("Not authenticated");
    return true;
  }
}

@Resolver(() => Card)
export class CardsResolver {
  constructor(
    private readonly store: CardStore,
    @Inject(ID_SOURCE) private readonly ids: IdSource,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => [Card])
  cards(): Card[] {
    return this.store.all();
  }

  @Mutation(() => Card)
  @UseGuards(GqlAuthGuard)
  async addCard(@Args("input") input: AddCardInput): Promise<Card> {
    const card: Card = { id: this.ids.next(), title: input.title, listId: input.listId };
    this.store.add(card);
    // Nest's default subscription resolve reads `payload[fieldName]`, so publish it keyed by the name.
    await this.pubSub.publish(CARD_ADDED, { [CARD_ADDED]: card });
    return card;
  }

  @Subscription(() => Card)
  cardAdded(): AsyncIterableIterator<{ cardAdded: Card }> {
    return this.pubSub.asyncIterableIterator<{ cardAdded: Card }>(CARD_ADDED);
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      // Expose the raw request on the context so the guard can read its headers.
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
  ],
  providers: [
    CardStore,
    CardsResolver,
    { provide: ID_SOURCE, useClass: SeqIdSource },
    { provide: PUB_SUB, useFactory: () => new PubSub() },
  ],
})
export class MutationsModule {}
