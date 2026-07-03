/**
 * Task 2 — Chat vertical slice (EXT, worked reference).
 *
 * The Chat capstone is Vite + Nest REST/WS + JWT/Passport + raw SQL — a DIFFERENT auth stack
 * from Kanban's Auth.js sessions (that contrast is the point of the capstone). Here we assemble
 * the realtime slice as pure logic:
 *
 *   - JWT auth with `jose` (`issueChatToken` / `verifyChatToken`) — a stateless HS256 token whose
 *     `exp` is checked against an INJECTED clock, so "expired" is deterministic under test;
 *   - a `ChatService` over an injected raw-SQL-shaped `MessageRepo` (`joinRoom` / `postMessage` /
 *     `history`), with history returned in insertion (time) order;
 *   - a `ChatGateway` that models the Nest WS gateway over a FAKED in-process transport: it
 *     authorizes every action with the JWT and broadcasts a posted message to the ROOM's members
 *     only. Each connection is a `useSocket`-style store (`subscribe`/`getSnapshot`) — exactly the
 *     shape a React `useSocket` hook binds via `useSyncExternalStore` (see module 22).
 *
 * No real ports, no `socket.io`: connections push to injected listeners. Ids/timestamps are
 * injected (never `Math.random()`/`Date.now()`).
 */
import { jwtVerify, SignJWT } from "jose";

/** Injected clock in ms since epoch — never `Date.now()`. */
export interface Clock {
  now(): number;
}

/** Injected opaque id source — never `Math.random()`. */
export interface IdSource {
  next(): string;
}

export const CHAT_TTL_S = 15 * 60; // 15 minutes

export interface ChatClaims {
  sub: string;
  rooms: string[];
}

/** Sign a short-lived HS256 chat token; `iat`/`exp` come from the injected clock. */
export async function issueChatToken(
  secret: Uint8Array,
  claims: ChatClaims,
  clock: Clock,
): Promise<string> {
  const iat = Math.floor(clock.now() / 1000);
  return new SignJWT({ sub: claims.sub, rooms: claims.rooms, iat, exp: iat + CHAT_TTL_S })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(secret);
}

/**
 * Verify a chat token against the injected clock. Resolves to the claims, or REJECTS if the
 * signature is bad or the token has expired (`exp <= now`). This is the JWT gate the gateway
 * runs before every socket action.
 */
export async function verifyChatToken(
  secret: Uint8Array,
  token: string,
  clock: Clock,
): Promise<ChatClaims> {
  const { payload } = await jwtVerify(token, secret, {
    currentDate: new Date(clock.now()),
  });
  return { sub: String(payload.sub), rooms: (payload.rooms as string[]) ?? [] };
}

export interface Message {
  id: string;
  room: string;
  userId: string;
  text: string;
  createdAt: number;
}

/** Raw-SQL-shaped repo boundary (the chat API uses `pg`, not Prisma). */
export interface MessageRepo {
  addMember(room: string, userId: string): Promise<void>;
  membersOf(room: string): Promise<string[]>;
  insertMessage(message: Message): Promise<Message>;
  /** Messages for a room, oldest-first. */
  listByRoom(room: string): Promise<Message[]>;
}

/** Genuine in-memory `MessageRepo` impl (the injected boundary, not a mock). */
export function createInMemoryMessageRepo(): MessageRepo {
  const members = new Map<string, Set<string>>();
  const messages: Message[] = [];

  return {
    async addMember(room, userId) {
      const set = members.get(room) ?? new Set<string>();
      set.add(userId);
      members.set(room, set);
    },
    async membersOf(room) {
      return [...(members.get(room) ?? new Set<string>())];
    },
    async insertMessage(message) {
      messages.push(message);
      return message;
    },
    async listByRoom(room) {
      return messages
        .filter((m) => m.room === room)
        .sort((a, b) => a.createdAt - b.createdAt);
    },
  };
}

/** Room/message service over the injected repo. Timestamps/ids come from injected deps. */
export class ChatService {
  constructor(
    private readonly repo: MessageRepo,
    private readonly ids: IdSource,
    private readonly clock: Clock,
  ) {}

  async joinRoom(userId: string, room: string): Promise<void> {
    await this.repo.addMember(room, userId);
  }

  async postMessage(
    userId: string,
    input: { room: string; text: string },
  ): Promise<Message> {
    const message: Message = {
      id: this.ids.next(),
      room: input.room,
      userId,
      text: input.text,
      createdAt: this.clock.now(),
    };
    return this.repo.insertMessage(message);
  }

  /** Ordered history (oldest-first) for a room. */
  async history(room: string): Promise<Message[]> {
    return this.repo.listByRoom(room);
  }
}

export interface SocketSnapshot {
  messages: Message[];
  lastMessage: Message | null;
}

/** The `useSocket`-style store one connection exposes — what `useSyncExternalStore` consumes. */
export interface ChatSocketStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): SocketSnapshot;
}

interface Connection {
  userId: string;
  rooms: Set<string>;
  push(message: Message): void;
}

/**
 * In-process chat gateway (the Nest WS gateway modelled over a faked transport). Every action
 * carries the JWT and is authorized with `verifyChatToken` first; a posted message is broadcast
 * to the room's CURRENT members only — a connection that never joined the room receives nothing.
 * `connect` hands back a `useSocket`-style store whose snapshot advances on each broadcast.
 */
export class ChatGateway {
  private readonly connections = new Map<string, Connection>();

  constructor(
    private readonly secret: Uint8Array,
    private readonly service: ChatService,
    private readonly clock: Clock,
  ) {}

  async connect(clientId: string, token: string): Promise<ChatSocketStore> {
    const claims = await verifyChatToken(this.secret, token, this.clock);
    const listeners = new Set<() => void>();
    // Cached snapshot: identity changes ONLY on a new message, so useSyncExternalStore is stable.
    let snapshot: SocketSnapshot = { messages: [], lastMessage: null };
    const connection: Connection = {
      userId: claims.sub,
      rooms: new Set<string>(),
      push(message) {
        snapshot = { messages: [...snapshot.messages, message], lastMessage: message };
        for (const listener of [...listeners]) listener();
      },
    };
    this.connections.set(clientId, connection);
    return {
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      getSnapshot() {
        return snapshot;
      },
    };
  }

  async join(clientId: string, token: string, room: string): Promise<void> {
    const claims = await verifyChatToken(this.secret, token, this.clock);
    const connection = this.connections.get(clientId);
    if (!connection) throw new Error("socket not connected");
    connection.rooms.add(room);
    await this.service.joinRoom(claims.sub, room);
  }

  async post(
    clientId: string,
    token: string,
    input: { room: string; text: string },
  ): Promise<Message> {
    const claims = await verifyChatToken(this.secret, token, this.clock);
    const connection = this.connections.get(clientId);
    if (!connection) throw new Error("socket not connected");
    const message = await this.service.postMessage(claims.sub, input);
    for (const conn of this.connections.values()) {
      if (conn.rooms.has(input.room)) conn.push(message);
    }
    return message;
  }

  disconnect(clientId: string): void {
    this.connections.delete(clientId);
  }
}
