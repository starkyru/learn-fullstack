# Module 18 — NestJS Fundamentals 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Take the "layered split" you refactored toward at the end of module 17 (Express) and let a framework
formalize it. Nest gives you **modules** (the composition root), a **DI container** that wires
**providers** into **controllers**, and a request pipeline of **pipes → guards → interceptors →
exception filters** — the same cross-cutting hooks you hand-rolled as Express middleware, now typed
and injectable. Everything here is **in-memory** (no database) and every collaborator — the id
source, the clock, the log sink, the api key — is **injected**, so the whole app is deterministic and
testable in-process with `@nestjs/testing` + `supertest`.

## Concepts

- **A module is the composition root; DI is constructor wiring.** `@Module({ controllers, providers })`
  registers a bag of providers. A `@Controller` never `new`s its service — it declares the dependency
  as a constructor parameter and Nest hands it the **singleton** instance registered under that token.
  Interfaces vanish at runtime, so non-class deps (an id source, a config value) are keyed by an
  explicit **token** and pulled in with `@Inject(TOKEN)`.
- **The request pipeline is ordered, composable hooks.** A request flows **pipe → guard →
  interceptor (before) → handler → interceptor (after) → exception filter**. A **pipe** transforms/
  validates a single argument (`ValidationPipe` runs a DTO's class-validator decorators; a custom
  `PipeTransform` parses a route param). A **guard** (`CanActivate`) returns `true`/throws to allow or
  deny. An **interceptor** wraps the handler's `Observable` (log timing, enforce a `timeout`). An
  **exception filter** (`@Catch()`) catches whatever escaped and shapes the HTTP response.
- **Nest's injector is just a container you could write yourself.** `providers` is `register`;
  `@Injectable()` + constructor params are `useClass` + its `deps`; the default singleton scope is a
  resolution cache; the "circular dependency" startup error is a cycle guard on the resolution stack.
  Task 4 builds that container from scratch, then maps each piece back to Nest.

## Tasks

| #   | Task                          | Lane | Type | What you build                                                      |
| --- | ----------------------------- | ---- | ---- | ------------------------------------------------------------------- |
| 1   | Module + controller + service | 🟢   | WE   | solved CardsController/Service + analog ListsController stub        |
| 2   | Pipes & validation            | 🟡   | TODO | DTO validation pipe + a custom parse pipe                           |
| 3   | Guards & interceptors         | 🟡   | TODO | an auth guard + a logging/timeout interceptor + an exception filter |
| 4   | Providers & DI                | 🔴   | FS   | a tiny DI container that explains Nest's injector, then map back    |

## Theory & docs

- **Module + controller + service** — [Modules](https://docs.nestjs.com/modules) ·
  [Controllers](https://docs.nestjs.com/controllers) · [Providers](https://docs.nestjs.com/providers)
- **Pipes & validation** — [Pipes](https://docs.nestjs.com/pipes) ·
  [Validation (`ValidationPipe` + class-validator)](https://docs.nestjs.com/techniques/validation)
- **Guards & interceptors** — [Guards](https://docs.nestjs.com/guards) ·
  [Interceptors](https://docs.nestjs.com/interceptors) ·
  [Exception filters](https://docs.nestjs.com/exception-filters)
- **Providers & DI** — [Custom providers (tokens, `useValue`/`useFactory`)](https://docs.nestjs.com/fundamentals/custom-providers) ·
  [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes) ·
  [Circular dependency](https://docs.nestjs.com/fundamentals/circular-dependency)
- Background — [Testing (`@nestjs/testing` + supertest)](https://docs.nestjs.com/fundamentals/testing)

## Done when

- [ ] DI resolves a service into a controller: the `CardsController` uses the injected `CardsService`
      **instance** (never `new`), `POST /cards` → `201` with an injected deterministic id, `GET /cards`
      → `200` list, `GET /cards/:id` → `200`/`404`. The analog `/lists` mirrors `/cards` exactly.
- [ ] Invalid DTOs are rejected: `ValidationPipe({ whitelist, transform })` 400s an empty or
      too-long `title` with the class-validator message and strips unknown keys; the custom
      `ParseIntParamPipe` returns `42` for `"42"` and throws `400` for `"abc"`.
- [ ] The filter shapes error responses: `AllExceptionsFilter` turns any thrown error into
      `{ statusCode, message, path }` (a `400` HttpException stays `400`; an unknown throw becomes
      `500`), and the guard blocks unauthenticated routes: `ApiKeyGuard` answers `401` without the
      `x-api-key` header and passes with it. The `LoggingInterceptor` logs `{method,url,ms}` to an
      injected sink and the `TimeoutInterceptor` maps a slow handler to a `RequestTimeoutException`.
- [ ] The from-scratch `Container` resolves a nested class graph, caches singletons (same instance
      twice), supports `useValue`/`useFactory`, and throws
      `Circular dependency detected: a -> b -> a` on a cycle.

## Toolchain note (why SWC, not plain vitest)

Nest's DI reads **decorator metadata** (`design:paramtypes`, emitted by `emitDecoratorMetadata`).
vitest's default esbuild transform does **not** emit it, so DI resolution and `ValidationPipe` would
silently break. This module transforms tests through **SWC** (`unplugin-swc`) with legacy decorators

- metadata, and `test/setup.ts` imports `reflect-metadata` first. `tsconfig.json` sets
  `experimentalDecorators`, `emitDecoratorMetadata`, `useDefineForClassFields: false` (so property/
  constructor injection works) and `verbatimModuleSyntax: false` (it conflicts with metadata emit).

> **Worked example (WE):** `Cards*` is fully solved in **both** `src/` and `solution/`; the analog
> `Lists*` throws `TODO` in `src/` — implement it by mirroring `Cards*`. **TODO** tasks throw in
> `src/`; keep the signature and return shape, implement the body. **From scratch (FS):** `src/`
> throws — build the machinery; the 🔴 lane forbids reaching for Nest's own injector. Tests import
> from `solution/`; point them at `../src/...` to grade your own build.
