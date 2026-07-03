/**
 * `MessageService` — the in-memory message store for the M0 slice.
 *
 * Milestone note: the real Pulse app writes messages through Prisma and reads recent history back
 * with a hand-written raw SQL query (the "Prisma-writes / raw-read" split the chat capstone teaches
 * in modules 15–16). Here it is a `Map<room, Message[]>` so the slice runs with no database. Its id
 * source is INJECTED (a seq counter, never `Math.random()`) so created ids are deterministic.
 */
import { Inject, Injectable } from "@nestjs/common";

export interface Message {
  id: string;
  room: string;
  from: string;
  text: string;
}

/** An injectable id source — a seq counter, never `Date.now()`/`Math.random()`. */
export interface IdSource {
  next(): string;
}

/** DI token for the id source. */
export const ID_SOURCE = "ID_SOURCE";

@Injectable()
export class SeqIdSource implements IdSource {
  private n = 0;
  next(): string {
    return String(++this.n);
  }
}

@Injectable()
export class MessageService {
  private readonly byRoom = new Map<string, Message[]>();

  constructor(@Inject(ID_SOURCE) private readonly ids: IdSource) {}

  /** Messages posted to `room`, oldest first. Unknown room → empty list. */
  list(room: string): Message[] {
    return this.byRoom.get(room) ?? [];
  }

  /** Append a message to `room` and return it (with its freshly minted id). */
  add(room: string, from: string, text: string): Message {
    const message: Message = { id: this.ids.next(), room, from, text };
    const existing = this.byRoom.get(room);
    if (existing) {
      existing.push(message);
    } else {
      this.byRoom.set(room, [message]);
    }
    return message;
  }
}
