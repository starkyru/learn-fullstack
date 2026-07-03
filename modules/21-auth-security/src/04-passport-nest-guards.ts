/**
 * Task 4 — Passport-style JWT auth guard + RBAC guard on Nest (TODO).
 *
 * The chat API is NestJS. Build the exact logic a Passport `JwtStrategy.validate()` performs — verify
 * the bearer token, hydrate `req.user` — as a `CanActivate` guard, plus a role guard. Signatures,
 * decorators, and wiring are fixed; implement the two `canActivate` bodies (both currently THROW).
 *   - `JwtAuthGuard.canActivate` — pull `Authorization: Bearer <jwt>`; missing/malformed →
 *     `UnauthorizedException`. `await jwtVerify(token, this.secret, { currentDate: new Date(this.clock.now()) })`;
 *     on success set `req.user = { sub, roles }` and return `true`; on any throw →
 *     `UnauthorizedException` (so invalid AND expired become 401).
 *   - `RolesGuard.canActivate` — read required roles via `this.reflector.get(ROLES_KEY, context.getHandler())`;
 *     none required → `true`; else `ForbiddenException` unless `req.user.roles` intersects them.
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

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    void this.secret;
    void this.clock;
    void jwtVerify;
    void UnauthorizedException;
    throw new Error(
      "TODO: verify the bearer JWT, attach req.user, else UnauthorizedException",
    );
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(_context: ExecutionContext): boolean {
    void this.reflector;
    void ROLES_KEY;
    void ForbiddenException;
    throw new Error(
      "TODO: read required roles via Reflector, 403 unless req.user has one",
    );
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
