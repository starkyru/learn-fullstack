/**
 * Task 3 — Guards & interceptors (TODO).
 *
 * The four cross-cutting hooks Nest gives you, all wired to INJECTED collaborators so they stay
 * deterministic (no `Date.now`, no ambient config):
 *   - `ApiKeyGuard`        — `CanActivate`; 401 a request missing the `x-api-key` header.
 *   - `LoggingInterceptor` — wrap the handler, log `{method,url,ms}` to an injected sink using an
 *                            injected clock.
 *   - `TimeoutInterceptor` — rxjs `timeout`; a handler slower than the injected budget becomes a
 *                            `RequestTimeoutException`.
 *   - `AllExceptionsFilter`— `ExceptionFilter`; shape ANY thrown error into `{statusCode,message,path}`.
 *
 * Every method body THROWS until you implement it.
 */
import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  UnauthorizedException,
  UseGuards,
  type ArgumentsHost,
  type CallHandler,
  type CanActivate,
  type ExceptionFilter,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { type Observable } from "rxjs";

/* ─────────────────────────── injected collaborators ─────────────────────────── */

export const API_KEY = "API_KEY";
export const LOG_SINK = "LOG_SINK";
export const CLOCK = "CLOCK";
export const TIMEOUT_MS = "TIMEOUT_MS";

export interface LogEntry {
  method: string;
  url: string;
  ms: number;
}

export interface LogSink {
  log(entry: LogEntry): void;
}

export interface Clock {
  now(): number;
}

/* ─────────────────────────── guard ─────────────────────────── */

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(API_KEY) private readonly expected: string) {}

  canActivate(_context: ExecutionContext): boolean {
    // TODO: read `x-api-key` off the request; throw `UnauthorizedException` on mismatch, else true.
    throw new UnauthorizedException("TODO: implement ApiKeyGuard");
  }
}

/* ─────────────────────────── interceptors ─────────────────────────── */

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOG_SINK) private readonly sink: LogSink,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  intercept(_context: ExecutionContext, _next: CallHandler): Observable<unknown> {
    // TODO: read the start time from `this.clock`, `next.handle().pipe(tap(...))`, and log
    // `{ method, url, ms }` to `this.sink` after the handler emits.
    throw new Error("TODO: implement LoggingInterceptor");
  }
}

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(@Inject(TIMEOUT_MS) private readonly ms: number) {}

  intercept(_context: ExecutionContext, _next: CallHandler): Observable<unknown> {
    // TODO: `next.handle().pipe(timeout(this.ms), catchError(...))` mapping rxjs `TimeoutError`
    // to `RequestTimeoutException` and rethrowing anything else.
    throw new Error("TODO: implement TimeoutInterceptor");
  }
}

/* ─────────────────────────── exception filter ─────────────────────────── */

export interface ErrorBody {
  statusCode: number;
  message: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(_exception: unknown, _host: ArgumentsHost): void {
    // TODO: derive `statusCode`/`message` (HttpException → getStatus()/message, else 500) and
    // `res.status(statusCode).json({ statusCode, message, path: req.url })`.
    throw new Error("TODO: implement AllExceptionsFilter");
  }
}

/* ─────────────────────────── demo wiring (used by the e2e tests) ─────────────────────────── */

@Controller("protected")
export class ProtectedController {
  @Get()
  @UseGuards(ApiKeyGuard)
  read(): { ok: true } {
    return { ok: true };
  }
}

@Controller("boom")
export class BoomController {
  @Get("known")
  known(): never {
    throw new BadRequestException("boom");
  }

  @Get("unknown")
  unknown(): never {
    throw new Error("kaboom");
  }
}

@Module({
  controllers: [ProtectedController, BoomController],
  providers: [{ provide: API_KEY, useValue: "s3cret" }],
})
export class GuardsModule {}
