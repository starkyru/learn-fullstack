import { createRequire } from "node:module";
import type { INestApplication } from "@nestjs/common";
import { GraphQLSchemaHost } from "@nestjs/graphql";
import { Test } from "@nestjs/testing";
import type { DocumentNode, ExecutionResult, GraphQLSchema } from "graphql";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CardsResolver, MutationsModule } from "../solution/03-mutations-subs.js";

// Nest builds the schema with the CJS `graphql` instance. Load the SAME instance here (not the ESM
// copy vitest would give a static `import`) so `execute`/`subscribe` accept that schema — otherwise
// graphql-js throws "Duplicate graphql modules" from its cross-realm instanceof check.
const gql = createRequire(import.meta.url)("graphql") as {
  parse: (src: string) => DocumentNode;
  execute: (args: {
    schema: GraphQLSchema;
    document: DocumentNode;
    contextValue: unknown;
  }) => Promise<ExecutionResult>;
  subscribe: (args: {
    schema: GraphQLSchema;
    document: DocumentNode;
    contextValue: unknown;
  }) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;
};

const ADD_CARD = /* GraphQL */ `
  mutation Add($input: AddCardInput!) {
    addCard(input: $input) {
      id
      title
      listId
    }
  }
`;

describe("Task 3 — mutations + subscriptions + auth context", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [MutationsModule] }).compile();
    app = ref.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("addCard (authenticated) creates a card with an injected deterministic id", async () => {
    const res = await request(app.getHttpServer())
      .post("/graphql")
      .set("authorization", "Bearer t0ken")
      .send({ query: ADD_CARD, variables: { input: { title: "Ship", listId: "l1" } } });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.addCard).toEqual({ id: "1", title: "Ship", listId: "l1" });
  });

  it("rejects an UNAUTHENTICATED addCard via the context guard", async () => {
    const res = await request(app.getHttpServer())
      .post("/graphql")
      .send({ query: ADD_CARD, variables: { input: { title: "Ship", listId: "l1" } } });

    expect(res.body.data?.addCard ?? null).toBeNull();
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Not authenticated/);
  });

  it("cardAdded subscription pushes a newly-added card to a subscriber", async () => {
    const resolver = app.get(CardsResolver);
    const iterator = resolver.cardAdded();

    // Start awaiting BEFORE the mutation fires; the pub/sub delivers the published card.
    const nextPushed = iterator.next();
    const created = await resolver.addCard({ title: "Realtime", listId: "l2" });
    const { value, done } = await nextPushed;

    expect(done).toBe(false);
    expect(value).toEqual({ cardAdded: { id: "1", title: "Realtime", listId: "l2" } });
    expect(created).toEqual({ id: "1", title: "Realtime", listId: "l2" });

    // Release the async iterator so the pub/sub listener is torn down (no leaked handle).
    await iterator.return?.();
  });

  it("delivers cardAdded THROUGH the compiled schema when a mutation publishes over the transport", async () => {
    // Drive the real @Subscription: run the subscription operation against Nest's compiled schema
    // (not by calling resolver.cardAdded() directly), then fire the mutation over HTTP transport.
    const { schema } = app.get(GraphQLSchemaHost);
    const subscribed = await gql.subscribe({
      schema,
      document: gql.parse(`subscription { cardAdded { id title listId } }`),
      contextValue: {},
    });
    if (!(Symbol.asyncIterator in subscribed)) {
      throw new Error(
        `expected an async iterator, got a plain result: ${JSON.stringify(subscribed)}`,
      );
    }
    const iterator = subscribed as AsyncIterableIterator<ExecutionResult>;

    // Await the pushed event BEFORE the mutation fires.
    const nextPushed = iterator.next();
    const res = await request(app.getHttpServer())
      .post("/graphql")
      .set("authorization", "Bearer t0ken")
      .send({
        query: ADD_CARD,
        variables: { input: { title: "Realtime", listId: "l2" } },
      });
    expect(res.body.errors).toBeUndefined();

    const { value, done } = await nextPushed;
    expect(done).toBe(false);
    expect(value).toEqual({
      data: { cardAdded: { id: "1", title: "Realtime", listId: "l2" } },
    });

    // Tear down the schema-level subscription so the pub/sub listener is released (no leaked handle).
    await iterator.return?.();
  });

  it("rejects an UNAUTHENTICATED addCard AT THE SCHEMA level via the @UseGuards pipeline", async () => {
    // Execute the mutation directly against the compiled schema with NO request in context. Nest bakes
    // the guard into the resolver's resolve fn, so the guard runs here; without @UseGuards it would not.
    const { schema } = app.get(GraphQLSchemaHost);
    const result = await gql.execute({
      schema,
      document: gql.parse(
        `mutation { addCard(input: { title: "Ship", listId: "l1" }) { id title listId } }`,
      ),
      contextValue: {},
    });

    expect(result.data?.addCard ?? null).toBeNull();
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toMatch(/Not authenticated/);
  });

  it("cards query reflects a card added by the mutation", async () => {
    const resolver = app.get(CardsResolver);
    await resolver.addCard({ title: "First", listId: "l1" });
    await resolver.addCard({ title: "Second", listId: "l1" });

    const res = await request(app.getHttpServer())
      .post("/graphql")
      .send({ query: `{ cards { id title listId } }` });

    expect(res.body.data.cards).toEqual([
      { id: "1", title: "First", listId: "l1" },
      { id: "2", title: "Second", listId: "l1" },
    ]);
  });
});
