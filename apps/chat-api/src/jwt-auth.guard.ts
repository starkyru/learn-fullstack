/**
 * `JwtAuthGuard` — the Passport-`JwtStrategy.validate()` logic as a Nest `CanActivate`.
 *
 * Reads `Authorization: Bearer <jwt>`, verifies it with jose against the INJECTED secret + clock,
 * and hydrates `req.user = { sub, roles }`. Missing header, malformed header, a bad signature, or an
 * expired token all become `UnauthorizedException` (401). Everything it needs is injected so
 * `@nestjs/testing` + supertest drive it deterministically.
 */
import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { jwtVerify } from "jose";
import { CLOCK, JWT_SECRET, type AccessClaims, type Clock } from "./tokens.js";

export interface RequestWithUser {
  headers: Record<string, unknown>;
  user?: AccessClaims;
}

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
      req.user = {
        sub: String(payload.sub),
        roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
      };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
