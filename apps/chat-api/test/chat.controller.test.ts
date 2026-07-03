import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChatModule } from "../src/chat.module.js";
import { CLOCK, JWT_SECRET, issueAccessToken, type Clock } from "../src/tokens.js";

// A fixed secret + frozen clock the test shares with the guard (overriding the module's real ones),
// so token verification is fully deterministic — no Date.now(), no Math.random().
const TEST_SECRET = new TextEncoder().encode("test-secret-000000000000000000000000");
const FIXED_NOW = 1_700_000_000_000;
const clock: Clock = { now: () => FIXED_NOW };

describe("ChatController — REST over MessageService, guarded by JwtAuthGuard", () => {
  let app: INestApplication;
  let token: string;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [ChatModule] })
      .overrideProvider(JWT_SECRET)
      .useValue(TEST_SECRET)
      .overrideProvider(CLOCK)
      .useValue(clock)
      .compile();
    app = ref.createNestApplication();
    await app.init();

    token = await issueAccessToken(TEST_SECRET, { sub: "alice", roles: [] }, clock);
  });

  afterEach(async () => {
    await app.close();
  });

  it("401s a request with no bearer token", async () => {
    const res = await request(app.getHttpServer()).get("/rooms/r1/messages");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing bearer token");
  });

  it("401s a request whose token is signed with the wrong secret", async () => {
    const forged = await issueAccessToken(
      new TextEncoder().encode("some-other-secret-999999999999999999"),
      { sub: "mallory", roles: [] },
      clock,
    );
    const res = await request(app.getHttpServer())
      .get("/rooms/r1/messages")
      .set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  it("POST → 201 with the exact message body, `from` taken from the verified token (not the body)", async () => {
    const res = await request(app.getHttpServer())
      .post("/rooms/r1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "hi bob", from: "IGNORED-CLIENT-CLAIM" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "1", room: "r1", from: "alice", text: "hi bob" });
  });

  it("GET → 200 returns the history for that room, ids incrementing 1,2", async () => {
    await request(app.getHttpServer())
      .post("/rooms/r1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "first" });
    await request(app.getHttpServer())
      .post("/rooms/r1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "second" });

    const res = await request(app.getHttpServer())
      .get("/rooms/r1/messages")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: "1", room: "r1", from: "alice", text: "first" },
      { id: "2", room: "r1", from: "alice", text: "second" },
    ]);
  });

  it("scopes history to the room in the path — a different room is empty", async () => {
    await request(app.getHttpServer())
      .post("/rooms/r1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "only r1" });

    const res = await request(app.getHttpServer())
      .get("/rooms/r2/messages")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
