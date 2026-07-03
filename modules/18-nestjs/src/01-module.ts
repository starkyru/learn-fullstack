/**
 * Task 1 — Module + controller + service (WORKED EXAMPLE).
 *
 * `Cards*` below is the fully-solved reference: a `CardsService` (in-memory CRUD, its id source
 * INJECTED so tests are deterministic) resolved by Nest's DI into a `CardsController`, both wired
 * into a `CardsModule`. Read it — then do YOUR TURN: fill in the analog `ListsService` /
 * `ListsController` / `ListsModule` so `/lists` mirrors `/cards` route-for-route.
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

/* ─────────────────────────── YOUR TURN: mirror Cards for Lists ───────────────────────────
 *
 * Inject `ID_SOURCE` into `ListsService`; give it `list()`, `get(id)` (404 via
 * `NotFoundException` when missing), and `create(title)`. Wire `@Controller("lists")` with
 * `@Get()`, `@Get(":id")`, `@Post()`, then register both in `ListsModule`.
 * Everything below THROWS until you implement it. */

@Injectable()
export class ListsService {
  constructor(@Inject(ID_SOURCE) private readonly ids: IdSource) {}

  list(): List[] {
    throw new Error("TODO: return every stored list (mirror CardsService.list)");
  }

  get(_id: string): List {
    throw new Error(
      "TODO: return the list or throw NotFoundException (mirror CardsService.get)",
    );
  }

  create(_title: string): List {
    throw new Error(
      "TODO: create a list with an injected id (mirror CardsService.create)",
    );
  }
}

@Controller("lists")
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  @Get()
  list(): List[] {
    throw new Error("TODO: delegate to ListsService.list (mirror CardsController.list)");
  }

  @Get(":id")
  get(@Param("id") _id: string): List {
    throw new Error("TODO: delegate to ListsService.get (mirror CardsController.get)");
  }

  @Post()
  create(@Body() _body: { title: string }): List {
    throw new Error(
      "TODO: delegate to ListsService.create (mirror CardsController.create)",
    );
  }
}

@Module({
  controllers: [ListsController],
  providers: [ListsService, { provide: ID_SOURCE, useClass: SeqIdSource }],
})
export class ListsModule {}
