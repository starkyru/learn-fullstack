import {
  Controller,
  Get,
  Module,
  Req,
  UseGuards,
  type INestApplication,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { SignJWT } from "jose";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthModule,
  CLOCK,
  DEMO_SECRET,
  FIXED_NOW,
  JWT_SECRET,
  JwtAuthGuard,
  RolesGuard,
  type Clock,
} from "../solution/04-passport-nest-guards.js";

interface ReqUser {
  user?: { sub: string };
}

/**
 * A route protected by RolesGuard but WITHOUT any `@Roles` decorator — exercises the
 * "no required roles ⇒ no restriction" branch that the AuthController's routes never hit.
 */
@Controller()
class OpenController {
  @Get("open")
  @UseGuards(JwtAuthGuard, RolesGuard)
  open(@Req() req: ReqUser): { sub: string } {
    return { sub: req.user?.sub ?? "" };
  }
}

@Module({
  controllers: [OpenController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    { provide: JWT_SECRET, useValue: DEMO_SECRET },
    { provide: CLOCK, useValue: { now: () => FIXED_NOW } satisfies Clock },
  ],
})
class OpenModule {}

/** Mint an access token the module's guard will accept (same secret + within the frozen clock). */
async function mintToken(opts: {
  sub: string;
  roles: string[];
  expOffsetS?: number;
}): Promise<string> {
  const iat = Math.floor(FIXED_NOW / 1000);
  return new SignJWT({ roles: opts.roles, iat, exp: iat + (opts.expOffsetS ?? 3600) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(opts.sub)
    .sign(DEMO_SECRET);
}

describe("Task 4 — Passport JWT guard + RBAC guard (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [AuthModule] }).compile();
    app = ref.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /me with no token → 401", async () => {
    const res = await request(app.getHttpServer()).get("/me");
    expect(res.status).toBe(401);
  });

  it("GET /me with a garbage token → 401", async () => {
    const res = await request(app.getHttpServer())
      .get("/me")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("GET /me with an expired token → 401", async () => {
    const token = await mintToken({ sub: "u1", roles: ["user"], expOffsetS: -10 });
    const res = await request(app.getHttpServer())
      .get("/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("GET /me with a valid token → 200 and echoes the authenticated subject", async () => {
    const token = await mintToken({ sub: "u1", roles: ["user"] });
    const res = await request(app.getHttpServer())
      .get("/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sub: "u1" });
  });

  it("GET /admin as a non-admin → 403", async () => {
    const token = await mintToken({ sub: "u2", roles: ["user"] });
    const res = await request(app.getHttpServer())
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("GET /admin as an admin → 200", async () => {
    const token = await mintToken({ sub: "boss", roles: ["user", "admin"] });
    const res = await request(app.getHttpServer())
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("Task 4 — RolesGuard with no @Roles decorator imposes no restriction (e2e)", () => {
  let openApp: INestApplication;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [OpenModule] }).compile();
    openApp = ref.createNestApplication();
    await openApp.init();
  });

  afterEach(async () => {
    await openApp.close();
  });

  it("GET /open (RolesGuard, no @Roles) → an authenticated non-admin reaches it with 200", async () => {
    const token = await mintToken({ sub: "u3", roles: ["user"] });
    const res = await request(openApp.getHttpServer())
      .get("/open")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sub: "u3" });
  });
});
