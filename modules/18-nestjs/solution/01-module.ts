/**
 * Task 1 — Module + controller + service (WORKED EXAMPLE).
 *
 * `Cards*` below is the fully-solved reference: a `CardsService` (in-memory CRUD, its id source
 * INJECTED so tests are deterministic) resolved by Nest's DI into a `CardsController`, both wired
 * into a `CardsModule`. Read it, then do YOUR TURN in `src/01-module.ts` — implement the analog
 * `ListsService` / `ListsController` / `ListsModule` so `/lists` mirrors `/cards` route-for-route.
 *
 * DI is the whole point: the controller never `new`s the service. It declares the dependency in
 * its constructor and Nest hands it the singleton instance the module registered.
 */
import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";

export interface Card {
  id: string;
  title: string;
}

export interface List {
  id: string;
  title: string;
}

/** An injectable id source — a seq counter, never `Date.now()`/`Math.random()`. */
export interface IdSource {
  next(): string;
}

/** DI token for the id source (interfaces vanish at runtime, so providers key off a token). */
export const ID_SOURCE = "ID_SOURCE";

@Injectable()
export class SeqIdSource implements IdSource {
  private n = 0;
  next(): string {
    return String(++this.n);
  }
}

@Injectable()
export class CardsService {
  private readonly cards = new Map<string, Card>();

  constructor(@Inject(ID_SOURCE) private readonly ids: IdSource) {}

  list(): Card[] {
    return [...this.cards.values()];
  }

  get(id: string): Card {
    const card = this.cards.get(id);
    if (!card) throw new NotFoundException(`Card ${id} not found`);
    return card;
  }

  create(title: string): Card {
    const card: Card = { id: this.ids.next(), title };
    this.cards.set(card.id, card);
    return card;
  }
}

@Controller("cards")
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  list(): Card[] {
    return this.cards.list();
  }

  @Get(":id")
  get(@Param("id") id: string): Card {
    return this.cards.get(id);
  }

  @Post()
  create(@Body() body: { title: string }): Card {
    return this.cards.create(body.title);
  }
}

@Module({
  controllers: [CardsController],
  providers: [CardsService, { provide: ID_SOURCE, useClass: SeqIdSource }],
})
export class CardsModule {}

/* ─────────────────────────── analog: Lists (solved here, stub in src) ─────────────────────────── */

@Injectable()
export class ListsService {
  private readonly lists = new Map<string, List>();

  constructor(@Inject(ID_SOURCE) private readonly ids: IdSource) {}

  list(): List[] {
    return [...this.lists.values()];
  }

  get(id: string): List {
    const list = this.lists.get(id);
    if (!list) throw new NotFoundException(`List ${id} not found`);
    return list;
  }

  create(title: string): List {
    const list: List = { id: this.ids.next(), title };
    this.lists.set(list.id, list);
    return list;
  }
}

@Controller("lists")
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  @Get()
  list(): List[] {
    return this.lists.list();
  }

  @Get(":id")
  get(@Param("id") id: string): List {
    return this.lists.get(id);
  }

  @Post()
  create(@Body() body: { title: string }): List {
    return this.lists.create(body.title);
  }
}

@Module({
  controllers: [ListsController],
  providers: [ListsService, { provide: ID_SOURCE, useClass: SeqIdSource }],
})
export class ListsModule {}
