/**
 * Task 4 — Providers & DI (SOLUTION, from scratch).
 *
 * A tiny DI container in pure TypeScript — no Nest, no `reflect-metadata`. It is the machinery
 * Nest's injector runs under the hood, boiled down to its essence:
 *   - `register(token, provider)` records HOW to build a token (`useClass` | `useValue` | `useFactory`,
 *     plus its `deps` — the tokens to resolve and pass in order).
 *   - `resolve(token)` recursively builds the dependency graph, CACHES each result (singleton scope),
 *     and DETECTS cycles instead of overflowing the stack.
 *
 * Mapping back to Nest (see the notes at the bottom of the file): a `@Module`'s `providers` array is
 * `register`; `@Injectable()` + constructor params are the `useClass` + `deps`; Nest's default
 * singleton scope is our `singletons` cache; Nest's "circular dependency" startup error is our
 * `resolving` guard.
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

  register<T>(token: Token, provider: Provider<T>): this {
    this.providers.set(token, provider as Provider<unknown>);
    return this;
  }

  resolve<T>(token: Token): T {
    // Singleton cache: a token already built is returned by identity.
    if (this.singletons.has(token)) return this.singletons.get(token) as T;

    const provider = this.providers.get(token);
    if (!provider) {
      throw new Error(`No provider registered for token: ${String(token)}`);
    }

    // A plain value has no dependencies and cannot form a cycle.
    if ("useValue" in provider) {
      this.singletons.set(token, provider.useValue);
      return provider.useValue as T;
    }

    // Cycle detection: this token is already mid-resolution higher up the stack.
    if (this.resolving.has(token)) {
      const cycle = [...this.resolving, token].map(String).join(" -> ");
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    this.resolving.add(token);
    try {
      const deps = (provider.deps ?? []).map((dep) => this.resolve(dep));
      const instance =
        "useClass" in provider
          ? new provider.useClass(...(deps as never[]))
          : provider.useFactory(...(deps as never[]));
      this.singletons.set(token, instance);
      return instance as T;
    } finally {
      this.resolving.delete(token);
    }
  }
}
