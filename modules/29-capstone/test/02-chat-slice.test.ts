import { describe, expect, it } from "vitest";
import {
  ChatGateway,
  ChatService,
  createInMemoryMessageRepo,
  issueChatToken,
  verifyChatToken,
  type Clock,
  type IdSource,
} from "../solution/02-chat-slice.js";

const SECRET = new TextEncoder().encode("test-chat-secret-value");

function fixedClock(ms: number): Clock {
  return { now: () => ms };
}

function seqIds(): IdSource {
  let n = 0;
  return { next: () => `m-${++n}` };
}

const NOW = 1_700_000_000_000; // fixed "current" time in ms

describe("JWT chat auth (jose)", () => {
  it("round-trips claims through a valid token", async () => {
    const token = await issueChatToken(
      SECRET,
      { sub: "user-1", rooms: ["general"] },
      fixedClock(NOW),
    );
    expect(await verifyChatToken(SECRET, token, fixedClock(NOW))).toEqual({
      sub: "user-1",
      rooms: ["general"],
    });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueChatToken(
      new TextEncoder().encode("attacker-secret"),
      { sub: "user-1", rooms: [] },
      fixedClock(NOW),
    );
    await expect(verifyChatToken(SECRET, token, fixedClock(NOW))).rejects.toThrow();
  });

  it("rejects an expired token (checked against the injected clock)", async () => {
    const token = await issueChatToken(
      SECRET,
      { sub: "user-1", rooms: [] },
      fixedClock(NOW),
    );
    // 20 minutes later — past the 15-minute TTL.
    const later = fixedClock(NOW + 20 * 60 * 1000);
    await expect(verifyChatToken(SECRET, token, later)).rejects.toThrow();
  });
});

describe("ChatGateway broadcast", () => {
  async function setup() {
    const clock = fixedClock(NOW);
    const service = new ChatService(createInMemoryMessageRepo(), seqIds(), clock);
    const gateway = new ChatGateway(SECRET, service, clock);
    const token = (sub: string) => issueChatToken(SECRET, { sub, rooms: [] }, clock);
    return { gateway, token };
  }

  it("broadcasts a posted message to the room's members only", async () => {
    const { gateway, token } = await setup();
    const [ta, tb, tc] = [await token("a"), await token("b"), await token("c")];

    const storeA = await gateway.connect("sock-a", ta);
    const storeB = await gateway.connect("sock-b", tb);
    const storeC = await gateway.connect("sock-c", tc);

    await gateway.join("sock-a", ta, "general");
    await gateway.join("sock-b", tb, "general");
    await gateway.join("sock-c", tc, "random"); // different room

    const sent = await gateway.post("sock-a", ta, { room: "general", text: "hi room" });

    // Members of "general" (a, b) receive it; the poster included.
    expect(storeA.getSnapshot().lastMessage).toEqual(sent);
    expect(storeB.getSnapshot().lastMessage).toEqual(sent);
    // c only joined "random" — it must receive nothing.
    expect(storeC.getSnapshot().lastMessage).toBeNull();
    expect(storeC.getSnapshot().messages).toEqual([]);
  });

  it("notifies a live subscriber exactly once per broadcast", async () => {
    const { gateway, token } = await setup();
    const ta = await token("a");
    const store = await gateway.connect("sock-a", ta);
    await gateway.join("sock-a", ta, "general");

    let notifications = 0;
    store.subscribe(() => (notifications += 1));
    await gateway.post("sock-a", ta, { room: "general", text: "ping" });

    expect(notifications).toBe(1);
  });

  it("rejects a connect with a tampered token", async () => {
    const { gateway } = await setup();
    await expect(gateway.connect("sock-x", "not.a.jwt")).rejects.toThrow();
  });

  it("rejects join() when the token is forged (signed with a different secret)", async () => {
    const { gateway, token } = await setup();
    const ta = await token("a");
    await gateway.connect("sock-a", ta); // a real, authenticated connection exists

    const forged = await issueChatToken(
      new TextEncoder().encode("attacker-secret"),
      { sub: "a", rooms: ["general"] },
      fixedClock(NOW),
    );
    await expect(gateway.join("sock-a", forged, "general")).rejects.toThrow();
  });

  it("rejects post() when the token is forged (signed with a different secret)", async () => {
    const { gateway, token } = await setup();
    const ta = await token("a");
    await gateway.connect("sock-a", ta);
    await gateway.join("sock-a", ta, "general");

    const forged = await issueChatToken(
      new TextEncoder().encode("attacker-secret"),
      { sub: "a", rooms: ["general"] },
      fixedClock(NOW),
    );
    await expect(
      gateway.post("sock-a", forged, { room: "general", text: "smuggled" }),
    ).rejects.toThrow();
  });

  it("stamps message.userId from the authenticated sub of each poster", async () => {
    const { gateway, token } = await setup();
    const talice = await token("alice");
    const tbob = await token("bob");
    const storeAlice = await gateway.connect("sock-alice", talice);
    const storeBob = await gateway.connect("sock-bob", tbob);
    await gateway.join("sock-alice", talice, "general");
    await gateway.join("sock-bob", tbob, "general");

    const first = await gateway.post("sock-alice", talice, {
      room: "general",
      text: "hi",
    });
    // The trusted userId comes from alice's JWT sub — not the input, not a constant.
    expect(first.userId).toBe("alice");
    expect(storeBob.getSnapshot().lastMessage?.userId).toBe("alice");

    const second = await gateway.post("sock-bob", tbob, { room: "general", text: "yo" });
    expect(second.userId).toBe("bob");
    expect(storeAlice.getSnapshot().lastMessage?.userId).toBe("bob");
  });

  it("keys fan-out on input.room, not the poster's first joined room", async () => {
    const { gateway, token } = await setup();
    const [ta, tb, tc] = [await token("a"), await token("b"), await token("c")];
    const storeA = await gateway.connect("sock-a", ta);
    const storeB = await gateway.connect("sock-b", tb);
    const storeC = await gateway.connect("sock-c", tc);

    // Poster a is in TWO rooms; "general" is joined FIRST (so it is a's first room).
    await gateway.join("sock-a", ta, "general");
    await gateway.join("sock-a", ta, "random");
    await gateway.join("sock-b", tb, "random"); // target room only
    await gateway.join("sock-c", tc, "general"); // the OTHER room only

    const sent = await gateway.post("sock-a", ta, { room: "random", text: "to random" });

    // Delivery is scoped to the TARGET room "random" (a, b), never the poster's first room.
    expect(storeA.getSnapshot().lastMessage).toEqual(sent);
    expect(storeB.getSnapshot().lastMessage).toEqual(sent);
    // c is in "general" only — keying on the poster's first room would wrongly reach c.
    expect(storeC.getSnapshot().lastMessage).toBeNull();
    expect(storeC.getSnapshot().messages).toEqual([]);
  });
});

describe("ChatService history", () => {
  it("returns a room's messages oldest-first", async () => {
    const clock = {
      t: NOW,
      now(): number {
        return this.t;
      },
    };
    const service = new ChatService(createInMemoryMessageRepo(), seqIds(), clock);

    clock.t = NOW + 300;
    await service.postMessage("a", { room: "general", text: "third-inserted-first?" });
    clock.t = NOW + 100;
    await service.postMessage("b", { room: "general", text: "earliest" });
    clock.t = NOW + 200;
    await service.postMessage("a", { room: "general", text: "middle" });
    // A message in another room must not leak into "general" history.
    clock.t = NOW + 50;
    await service.postMessage("c", { room: "random", text: "elsewhere" });

    const history = await service.history("general");
    expect(history.map((m) => m.text)).toEqual([
      "earliest",
      "middle",
      "third-inserted-first?",
    ]);
    expect(history.map((m) => m.createdAt)).toEqual([NOW + 100, NOW + 200, NOW + 300]);
  });
});
