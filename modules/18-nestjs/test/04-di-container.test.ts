import { describe, expect, it } from "vitest";
import { Container } from "../solution/04-di-container.js";

class Logger {
  readonly tag = "logger";
}

class Db {
  constructor(readonly logger: Logger) {}
}

class Service {
  constructor(readonly db: Db) {}
}

describe("Task 4 — from-scratch DI container", () => {
  it("resolves a class graph with nested deps into a working instance", () => {
    const c = new Container();
    c.register("logger", { useClass: Logger });
    c.register("db", { useClass: Db, deps: ["logger"] });
    c.register("service", { useClass: Service, deps: ["db"] });

    const service = c.resolve<Service>("service");
    expect(service).toBeInstanceOf(Service);
    expect(service.db).toBeInstanceOf(Db);
    expect(service.db.logger).toBeInstanceOf(Logger);
    expect(service.db.logger.tag).toBe("logger");
  });

  it("caches singletons — the same token resolves to the same instance", () => {
    const c = new Container();
    c.register("logger", { useClass: Logger });
    c.register("db", { useClass: Db, deps: ["logger"] });

    const a = c.resolve<Db>("db");
    const b = c.resolve<Db>("db");
    expect(a).toBe(b);
    // shared dependency is the same instance too
    expect(a.logger).toBe(c.resolve<Logger>("logger"));
  });

  it("supports useValue and useFactory providers", () => {
    const c = new Container();
    const config = { port: 3000 };
    c.register("config", { useValue: config });
    c.register("url", {
      useFactory: (cfg: { port: number }) => `http://localhost:${cfg.port}`,
      deps: ["config"],
    });

    expect(c.resolve("config")).toBe(config);
    expect(c.resolve("url")).toBe("http://localhost:3000");
  });

  it("throws a clear error for an unregistered token", () => {
    const c = new Container();
    expect(() => c.resolve("missing")).toThrow(
      "No provider registered for token: missing",
    );
  });

  it("detects a circular dependency and reports the cycle path", () => {
    const c = new Container();
    class CycA {
      constructor(readonly other: unknown) {}
    }
    class CycB {
      constructor(readonly other: unknown) {}
    }
    c.register("a", { useClass: CycA, deps: ["b"] });
    c.register("b", { useClass: CycB, deps: ["a"] });

    let message = "";
    try {
      c.resolve("a");
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toBe("Circular dependency detected: a -> b -> a");
  });
});
