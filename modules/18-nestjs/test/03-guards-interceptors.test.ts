import type { CallHandler, ExecutionContext, INestApplication } from "@nestjs/common";
import { RequestTimeoutException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { firstValueFrom, NEVER, of } from "rxjs";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AllExceptionsFilter,
  type Clock,
  GuardsModule,
  LoggingInterceptor,
  type LogEntry,
  type LogSink,
  TimeoutInterceptor,
} from "../solution/03-guards-interceptors.js";

function httpContext(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe("Task 3 — guards, interceptors & the exception filter", () => {
  describe("ApiKeyGuard + AllExceptionsFilter (e2e)", () => {
    let app: INestApplication;

    beforeEach(async () => {
      const ref = await Test.createTestingModule({ imports: [GuardsModule] }).compile();
      app = ref.createNestApplication();
      app.useGlobalFilters(new AllExceptionsFilter());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it("guard blocks a request without the api key → 401", async () => {
      const res = await request(app.getHttpServer()).get("/protected");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        statusCode: 401,
        message: "Missing or invalid API key",
        path: "/protected",
      });
    });

    it("guard passes a request carrying the api key → 200", async () => {
      const res = await request(app.getHttpServer())
        .get("/protected")
        .set("x-api-key", "s3cret");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it("filter shapes a thrown HttpException into {statusCode,message,path}", async () => {
      const res = await request(app.getHttpServer()).get("/boom/known");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ statusCode: 400, message: "boom", path: "/boom/known" });
    });

    it("filter maps an unknown throw to a 500 with a generic message", async () => {
      const res = await request(app.getHttpServer()).get("/boom/unknown");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        statusCode: 500,
        message: "Internal server error",
        path: "/boom/unknown",
      });
    });
  });

  describe("LoggingInterceptor (injected sink + clock)", () => {
    it("logs {method,url,ms} once the handler emits, and passes the value through", async () => {
      const entries: LogEntry[] = [];
      const sink: LogSink = { log: (e) => entries.push(e) };
      const ticks = [100, 130];
      const clock: Clock = { now: () => ticks.shift() ?? -1 };

      const interceptor = new LoggingInterceptor(sink, clock);
      const ctx = httpContext({ method: "GET", url: "/things" });
      const handler = { handle: () => of("payload") } as CallHandler;

      const value = await firstValueFrom(interceptor.intercept(ctx, handler));

      expect(value).toBe("payload");
      expect(entries).toEqual([{ method: "GET", url: "/things", ms: 30 }]);
    });
  });

  describe("TimeoutInterceptor (rxjs timeout)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("passes a fast handler straight through", async () => {
      const interceptor = new TimeoutInterceptor(50);
      const handler = { handle: () => of("fast") } as CallHandler;
      const value = await firstValueFrom(interceptor.intercept(httpContext({}), handler));
      expect(value).toBe("fast");
    });

    it("converts a slow handler into a RequestTimeoutException", () => {
      vi.useFakeTimers();
      const interceptor = new TimeoutInterceptor(50);
      const handler = { handle: () => NEVER } as CallHandler;

      let caught: unknown;
      interceptor.intercept(httpContext({}), handler).subscribe({
        error: (err: unknown) => {
          caught = err;
        },
      });

      vi.advanceTimersByTime(50);
      expect(caught).toBeInstanceOf(RequestTimeoutException);
    });
  });
});
