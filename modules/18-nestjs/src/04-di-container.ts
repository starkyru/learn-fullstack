/**
 * Task 4 — Providers & DI (FROM SCRATCH).
 *
 * Build a tiny DI container in pure TypeScript — no Nest, no `reflect-metadata`. It is the machinery
 * Nest's injector runs under the hood, boiled down to its essence:
 *   - `register(token, provider)` records HOW to build a token (`useClass` | `useValue` | `useFactory`,
 *     plus its `deps` — the tokens to resolve and pass in order).
 *   - `resolve(token)` recursively builds the dependency graph, CACHES each result (singleton scope),
 *     and DETECTS cycles instead of overflowing the stack.
 *
 * Steps for `resolve`:
 *   1. return the cached singleton if present;
 *   2. look up the provider (throw `No provider registered for token: <t>` if missing);
 *   3. `useValue` → cache + return it (no deps, no cycle possible);
 *   4. if the token is already on the resolution stack → throw
 *      `Circular dependency detected: a -> b -> a`;
 *   5. mark it resolving, resolve `deps` in order, build via `new useClass(...)` / `useFactory(...)`,
 *      cache the instance, and (in a `finally`) unmark it.
 */

export type Token = string | symbol;
export type Ctor<T = unknown> = new (...args: never[]) => T;

export interface ClassProvider<T> {
  useClass: Ctor<T>;
  deps?: Token[];
}
export interface ValueProvider<T> {
  useValue: T;
}
export interface FactoryProvider<T> {
  useFactory: (...args: never[]) => T;
  deps?: Token[];
}
export type Provider<T> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

export class Container {
  private readonly providers = new Map<Token, Provider<unknown>>();
  private readonly singletons = new Map<Token, unknown>();
  private readonly resolving = new Set<Token>();

  register<T>(_token: Token, _provider: Provider<T>): this {
    throw new Error("TODO: store the provider keyed by token and return `this`");
  }

  resolve<T>(_token: Token): T {
    throw new Error("TODO: recursively build the token, cache singletons, detect cycles");
  }
}
