/**
 * In-memory Kanban store for the M0 slice — deterministic seed, an INJECTED id source (no
 * `Date.now()`/`Math.random()`), and the two mutations the resolver exposes: `createCard` and
 * `moveCard`. The store IS the source of truth; the resolver just returns these objects and lets
 * `@nestjs/graphql` walk the `@Field`s. Milestones M1+ swap this for `@learn-fullstack/db` (Prisma).
 */
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UserSchema, type User } from "@learn-fullstack/shared";
import type { Board, Card, Column } from "./board.model.js";

/** DI token + contract for a deterministic id generator (a seq counter in prod code, swappable in tests). */
export const ID_SOURCE = "ID_SOURCE";
export interface IdSource {
  next(): string;
}

@Injectable()
export class SeqIdSource implements IdSource {
  private n = 0;
  next(): string {
    return `card-${++this.n}`;
  }
}

@Injectable()
export class BoardsService {
  private readonly boards: Board[];

  constructor(@Inject(ID_SOURCE) private readonly ids: IdSource) {
    // Run the seed owner through the shared zod contract so client and server agree on one User shape.
    const owner: User = UserSchema.parse({
      id: "user-ada",
      email: "ada@trellix.dev",
      name: "Ada Lovelace",
    });

    this.boards = [
      {
        id: "board-1",
        slug: "trellix",
        name: "Trellix Roadmap",
        owner,
        columns: [
          {
            id: "col-todo",
            boardId: "board-1",
            title: "To Do",
            cards: [
              {
                id: "card-design",
                columnId: "col-todo",
                title: "Design the GraphQL schema",
              },
            ],
          },
          {
            id: "col-doing",
            boardId: "board-1",
            title: "In Progress",
            cards: [
              {
                id: "card-wire",
                columnId: "col-doing",
                title: "Wire the BoardsResolver",
              },
            ],
          },
          {
            id: "col-done",
            boardId: "board-1",
            title: "Done",
            cards: [],
          },
        ],
      },
    ];
  }

  findAll(): Board[] {
    return this.boards;
  }

  findBySlug(slug: string): Board | null {
    return this.boards.find((b) => b.slug === slug) ?? null;
  }

  /** Appends a new card (with an injected, deterministic id) to `columnId`. Throws if the column is unknown. */
  createCard(columnId: string, title: string): Card {
    const column = this.column(columnId);
    if (!column) throw new NotFoundException(`Column ${columnId} not found`);
    const card: Card = { id: this.ids.next(), columnId, title };
    column.cards.push(card);
    return card;
  }

  /** Moves an existing card to `toColumnId`, updating its `columnId`. Throws if either card or target is unknown. */
  moveCard(cardId: string, toColumnId: string): Card {
    const columns = this.allColumns();
    const source = columns.find((c) => c.cards.some((card) => card.id === cardId));
    if (!source) throw new NotFoundException(`Card ${cardId} not found`);
    const target = columns.find((c) => c.id === toColumnId);
    if (!target) throw new NotFoundException(`Column ${toColumnId} not found`);

    const index = source.cards.findIndex((card) => card.id === cardId);
    const [card] = source.cards.splice(index, 1);
    if (!card) throw new NotFoundException(`Card ${cardId} not found`);
    card.columnId = toColumnId;
    target.cards.push(card);
    return card;
  }

  private allColumns(): Column[] {
    return this.boards.flatMap((b) => b.columns);
  }

  private column(id: string): Column | undefined {
    return this.allColumns().find((c) => c.id === id);
  }
}
