/**
 * Task 3 — Mutations + subscriptions with an auth context. TODO: implement `addCard` + `cardAdded`.
 *
 * `addCard` must mutate in-memory state, PUBLISH the new card to the `PubSub`, and return it;
 * `cardAdded` returns the pub/sub's async iterator so a subscriber receives every published card.
 * `GqlAuthGuard` (done) rejects an unauthenticated `addCard` by reading the request off the GraphQL
 * context. Determinism: take the new id from the injected `IdSource` (a seq counter), never
 * `Date.now()`/`Math.random()`. Tests import from `solution/`; retarget to `../src/` to grade yours.
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
  async addCard(@Args("input") _input: AddCardInput): Promise<Card> {
    throw new Error(
      "TODO: build a Card with this.ids.next(), store it, publish { [CARD_ADDED]: card }, and return it",
    );
  }

  @Subscription(() => Card)
  cardAdded(): AsyncIterableIterator<{ cardAdded: Card }> {
    throw new Error("TODO: return this.pubSub.asyncIterableIterator(CARD_ADDED)");
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
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
