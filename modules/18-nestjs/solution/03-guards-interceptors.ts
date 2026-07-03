/**
 * Task 3 — Guards & interceptors (SOLUTION).
 *
 * The four cross-cutting hooks Nest gives you, all wired to INJECTED collaborators so they stay
 * deterministic (no `Date.now`, no ambient config):
 *   - `ApiKeyGuard`        — `CanActivate`; 401s a request missing the `x-api-key` header.
 *   - `LoggingInterceptor` — wraps the handler, logs `{method,url,ms}` to an injected sink using an
 *                            injected clock.
 *   - `TimeoutInterceptor` — rxjs `timeout`; a handler slower than the injected budget becomes a
 *                            `RequestTimeoutException`.
 *   - `AllExceptionsFilter`— `ExceptionFilter`; shapes ANY thrown error into `{statusCode,message,path}`.
 */
import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Module,
  RequestTimeoutException,
  UnauthorizedException,
  UseGuards,
  type ArgumentsHost,
  type CallHandler,
  type CanActivate,
  type ExceptionFilter,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import {
  catchError,
  tap,
  throwError,
  timeout,
  TimeoutError,
  type Observable,
} from "rxjs";

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

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    if (req.headers["x-api-key"] !== this.expected) {
      throw new UnauthorizedException("Missing or invalid API key");
    }
    return true;
  }
}

/* ─────────────────────────── interceptors ─────────────────────────── */

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LOG_SINK) private readonly sink: LogSink,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const start = this.clock.now();
    return next.handle().pipe(
      tap(() => {
        this.sink.log({ method: req.method, url: req.url, ms: this.clock.now() - start });
      }),
    );
  }
}

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(@Inject(TIMEOUT_MS) private readonly ms: number) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.ms),
      catchError((err: unknown) =>
        err instanceof TimeoutError
          ? throwError(() => new RequestTimeoutException("Request timed out"))
          : throwError(() => err),
      ),
    );
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
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<{
      status(code: number): { json(body: ErrorBody): void };
    }>();
    const req = ctx.getRequest<{ url: string }>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.message : "Internal server error";

    res.status(statusCode).json({ statusCode, message, path: req.url });
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
