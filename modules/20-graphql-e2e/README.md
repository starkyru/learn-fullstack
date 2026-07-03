# Module 20 — GraphQL End-to-End 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

One code-first GraphQL schema (NestJS) and a typed React client that share the same shapes. No
database — every collaborator (the id source, the list repository, the pub/sub, the client's `fetch`)
is **in-memory and injected**, so the whole stack is deterministic and testable in-process with
`@nestjs/testing` + `supertest` (server) and RTL + MSW (client). You build the server resolvers,
kill an N+1 with a per-request DataLoader, add a mutation + a subscription behind an auth context,
then a typed client with a **normalized cache** and **optimistic updates** — and finally the same
query through `graphql-request` to compare cache philosophies.

## Concepts

- **Code-first schema = your decorated classes.** `@ObjectType`/`@Field` classes plus `@Resolver` +
  `@Query`/`@Mutation`/`@ResolveField` ARE the schema; `autoSchemaFile: true` reflects the decorator
  metadata into an in-memory SDL. The types the server resolves are the types the client queries —
  one source of truth, no drift. A nested field (`User.lists`, `Card.list`) is a `@ResolveField` that
  runs once per parent.
- **DataLoader turns N+1 into 1.** "Once per parent" is the trap: resolving N cards' `.list` naively
  fires N fetches. A per-request DataLoader queues every `.load(id)` in a tick and flushes them as a
  single `batchFn(keys)` call. It lives on the GraphQL **context** (fresh per operation), so batching
  is request-scoped and never leaks a cache across requests.
- **Mutations publish; subscriptions consume; the context carries auth.** `addCard` mutates state and
  `PubSub.publish`es the new card; `cardAdded` is a `@Subscription` returning that pub/sub's async
  iterator, so a subscriber receives every later add. A guard reads the request off the GraphQL
  context to allow/deny — auth is just context.
- **A client cache is either a document cache or an entity cache.** A **normalized cache** keys every
  entity by `__typename:id`, so one card is one entry reused everywhere — which is what makes an
  **optimistic** insert show up instantly and reconcile cleanly on resolve. `graphql-request` +
  TanStack Query instead cache the whole response under a `queryKey`: coarser, no entity sharing.

## Tasks

| #   | Task                      | Lane | Type | What you build                                                                            |
| --- | ------------------------- | ---- | ---- | ----------------------------------------------------------------------------------------- |
| 1   | Nest resolvers            | 🟢   | WE   | solved usersResolver + analog postsResolver/cardsResolver stub                            |
| 2   | DataLoader batching       | 🟡   | TODO | batch card→list lookups; prove N+1 is gone                                                |
| 3   | Mutations + subscriptions | 🟡   | TODO | addCard mutation + cardAdded subscription with auth context                               |
| 4   | Typed React client        | 🟢   | WE   | solved codegen'd useCardsQuery + analog mutation-hook stub; normalized cache + optimistic |
| 5   | graphql-request alt       | 🟢   | EXT  | same query via TanStack Query + graphql-request; compare                                  |

## Theory & docs

- **Nest resolvers** — [Nest GraphQL quick start (code first)](https://docs.nestjs.com/graphql/quick-start) ·
  [Resolvers](https://docs.nestjs.com/graphql/resolvers) ·
  [Schemas and types (graphql.org)](https://graphql.org/learn/schema/)
- **DataLoader batching** — [GraphQL best practices (server-side batching & caching)](https://graphql.org/learn/best-practices/) ·
  [dataloader README (theory)](https://github.com/graphql/dataloader)
- **Mutations + subscriptions** — [Mutations](https://docs.nestjs.com/graphql/mutations) ·
  [Subscriptions](https://docs.nestjs.com/graphql/subscriptions) ·
  [Other features (guards on the GraphQL context)](https://docs.nestjs.com/graphql/other-features)
- **Typed React client** — [Caching & global object identity (graphql.org)](https://graphql.org/learn/caching/) ·
  [`useSyncExternalStore` (react.dev)](https://react.dev/reference/react/useSyncExternalStore)
- **graphql-request alt** — [Serving over HTTP (graphql.org)](https://graphql.org/learn/serving-over-http/) ·
  [TanStack Query docs](https://tanstack.com/query/latest)
- Background — [Queries and mutations (graphql.org)](https://graphql.org/learn/queries/) ·
  [Execution (how resolvers run)](https://graphql.org/learn/execution/)

## Done when

- [ ] **Client + server share types.** The code-first `@ObjectType`s drive both the server's resolved
      shapes and the client's queries; `{ users { lists { … } } }` and `{ cards { list { … } } }`
      return exactly the seeded data.
- [ ] **DataLoader collapses N+1 into one batch.** Querying N cards' `.list` calls the list-fetch
      boundary **once** with all N ids, and each request gets a **fresh** loader.
- [ ] **A subscription pushes a new card to another client.** Subscribing to `cardAdded` and then
      firing `addCard` delivers the new card to the subscriber; an unauthenticated `addCard` is
      rejected by the context guard.
- [ ] **The optimistic mutation updates the normalized cache.** `useAddCardMutation` inserts a temp
      card into the `__typename:id` cache immediately (visible in the UI), then reconciles it with the
      server's real card on resolve (and rolls back on error).

## Toolchain note (why SWC, not plain vitest)

Nest's DI and code-first GraphQL read **decorator metadata** (`design:paramtypes`, emitted by
`emitDecoratorMetadata`). vitest's default esbuild transform does **not** emit it, so the schema and
DI would silently break. This module transforms everything through **SWC** (`unplugin-swc`), which
derives its legacy-decorator, metadata, and **JSX** settings from `tsconfig.json` (`jsx: react-jsx` →
automatic runtime, so `.tsx` files need no `import React`). Server tests run in the default `node`
environment; each React **client** test opts into jsdom with a `// @vitest-environment jsdom` comment
on its first line. `test/setup.ts` imports `reflect-metadata` first, then `@testing-library/jest-dom`.

> **Worked example (WE):** the reference (`usersResolver`, `useCardsQuery`) is solved in **both**
> `src/` and `solution/`; the analog (`cardsResolver`, `useAddCardMutation`) throws `TODO` in `src/`
> — implement it by mirroring the reference. **TODO** tasks throw in `src/`; keep the signature and
> return shape, implement the body. **Extended (EXT):** `src/` mirrors `solution/` so you can read a
> full alternative. Tests import from `solution/`; point them at `../src/...` to grade your own build.
