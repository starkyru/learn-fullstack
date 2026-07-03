/**
 * Task 4 — Passport-style JWT auth guard + RBAC guard on Nest (SOLUTION).
 *
 * The chat API is NestJS. Instead of pulling in `passport-jwt`'s runtime, we build the exact logic a
 * Passport `JwtStrategy.validate()` performs — verify the bearer token, hydrate `req.user` — as a
 * `CanActivate` guard, plus a role guard:
 *   - `JwtAuthGuard` — reads `Authorization: Bearer <jwt>`, verifies it with jose against the
 *     injected secret + clock, and attaches `{ sub, roles }` to the request. Missing/invalid/expired
 *     → `UnauthorizedException` (401).
 *   - `@Roles('admin')` + `RolesGuard` — RBAC. Reads the required roles off the handler via
 *     `Reflector`; a user lacking them gets `ForbiddenException` (403). No `@Roles` = no restriction.
 *
 * Everything is injected (secret, clock) so `@nestjs/testing` + supertest can drive it deterministically.
 */
import {
  ForbiddenException,
  Get,
  Inject,
  Injectable,
  Req,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  Controller,
  Module,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { jwtVerify } from "jose";

export const JWT_SECRET = "JWT_SECRET";
export const CLOCK = "CLOCK";
export const ROLES_KEY = "roles";

/** The demo signing secret + a frozen clock the module + tests share. */
export const DEMO_SECRET = new TextEncoder().encode("chat-api-access-secret-0000000000");
export const FIXED_NOW = 1_700_000_000_000;

export interface Clock {
  now(): number;
}

export interface AuthedUser {
  sub: string;
  roles: string[];
}

interface RequestWithUser {
  headers: Record<string, unknown>;
  user?: AuthedUser;
}

/** `@Roles('admin', 'owner')` — stamps the required roles onto the route handler's metadata. */
export const Roles = (...roles: string[]): MethodDecorator =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_SECRET) private readonly secret: Uint8Array,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const header = req.headers["authorization"];
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length);
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        currentDate: new Date(this.clock.now()),
      });
      req.user = { sub: String(payload.sub), roles: (payload.roles as string[]) ?? [] };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[] | undefined>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const roles = req.user?.roles ?? [];
    if (!required.some((r) => roles.includes(r))) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}

@Controller()
export class AuthController {
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestWithUser): { sub: string } {
    // The guard verified the token and attached `req.user`.
    return { sub: req.user?.sub ?? "" };
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  admin(): { ok: true } {
    return { ok: true };
  }
}

@Module({
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    { provide: JWT_SECRET, useValue: DEMO_SECRET },
    { provide: CLOCK, useValue: { now: () => FIXED_NOW } satisfies Clock },
  ],
})
export class AuthModule {}
