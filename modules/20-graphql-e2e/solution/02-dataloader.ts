/**
 * Task 2 — DataLoader batching (kill the N+1).
 *
 * Resolving `cards { list }` calls the `Card.list` field resolver ONCE PER CARD. Done naively that
 * is N separate `fetchByIds` round-trips — the classic N+1. A per-request DataLoader fixes it: every
 * `.load(id)` in the same tick is queued, then a single microtask flush calls the batch fn ONCE with
 * ALL the ids. The loader lives on the GraphQL `context` (fresh per operation), so batching never
 * leaks across requests and a request never sees another request's cache.
 *
 * `SimpleDataLoader` is the whole mechanism (no `dataloader` dependency). `ListRepository.fetchByIds`
 * is the boundary the test spies on: with the loader, N cards → exactly ONE call carrying all N ids.
 */
import { Injectable, Module } from "@nestjs/common";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import {
  Context,
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
export class List {
  @Field(() => ID) id!: string;
  @Field() title!: string;
}

@ObjectType()
export class Card {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field(() => ID) listId!: string;
}

/**
 * A minimal DataLoader: coalesces every `.load(key)` made before the next microtask into one
 * `batchFn(keys)` call. `batchFn` MUST return one value per key, in the same order.
 */
export class SimpleDataLoader<K, V> {
  private queue: { key: K; resolve: (v: V) => void; reject: (e: unknown) => void }[] = [];
  private scheduled = false;

  constructor(private readonly batchFn: (keys: K[]) => Promise<V[]>) {}

  load(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      if (!this.scheduled) {
        this.scheduled = true;
        // Flush AFTER all synchronously-issued loads for this tick have enqueued.
        queueMicrotask(() => void this.flush());
      }
    });
  }

  private async flush(): Promise<void> {
    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;
    const keys = batch.map((b) => b.key);
    try {
      const values = await this.batchFn(keys);
      batch.forEach((b, i) => b.resolve(values[i] as V));
    } catch (err) {
      batch.forEach((b) => b.reject(err));
    }
  }
}

/** The batched boundary. `fetchByIds` returns lists in the SAME ORDER as the requested ids. */
@Injectable()
export class ListRepository {
  private readonly lists = new Map<string, List>([
    ["l1", { id: "l1", title: "Todo" }],
    ["l2", { id: "l2", title: "Doing" }],
    ["l3", { id: "l3", title: "Done" }],
  ]);

  async fetchByIds(ids: string[]): Promise<(List | null)[]> {
    return ids.map((id) => this.lists.get(id) ?? null);
  }
}

@Injectable()
export class CardStore {
  readonly cards: Card[] = [
    { id: "c1", title: "Alpha", listId: "l1" },
    { id: "c2", title: "Beta", listId: "l2" },
    { id: "c3", title: "Gamma", listId: "l1" },
  ];
}

/** Shape of the per-request GraphQL context the loader rides on. */
export interface LoaderContext {
  loaders: { list: SimpleDataLoader<string, List | null> };
}

/** Build a fresh set of loaders for ONE request, closing over the singleton repo. */
export function createLoaders(repo: ListRepository): LoaderContext["loaders"] {
  return {
    list: new SimpleDataLoader<string, List | null>((ids) => repo.fetchByIds(ids)),
  };
}

@Resolver(() => Card)
export class CardsResolver {
  constructor(private readonly store: CardStore) {}

  @Query(() => [Card])
  cards(): Card[] {
    return this.store.cards;
  }

  @ResolveField(() => List, { nullable: true })
  list(@Parent() card: Card, @Context() ctx: LoaderContext): Promise<List | null> {
    // Every card's `.load` this tick collapses into ONE `fetchByIds` batch.
    return ctx.loaders.list.load(card.listId);
  }
}

@Module({
  providers: [ListRepository],
  exports: [ListRepository],
})
export class RepositoryModule {}

@Module({
  imports: [
    RepositoryModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [RepositoryModule],
      inject: [ListRepository],
      useFactory: (repo: ListRepository) => ({
        autoSchemaFile: true,
        // A NEW loader per request → batching is scoped, never shared between operations.
        context: () => ({ loaders: createLoaders(repo) }),
      }),
    }),
  ],
  providers: [CardStore, CardsResolver],
})
export class DataloaderModule {}
