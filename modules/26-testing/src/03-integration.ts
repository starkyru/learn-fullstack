/**
 * Task 3 — Integration (TODO).
 *
 * Implement `PgCardRepo` so it talks to a REAL Postgres over `pg`. The DI wiring, the controller
 * and the `forRoot(url)` dynamic module are done for you — the TODO is the repository:
 *   - `migrate()`  → `CREATE TABLE IF NOT EXISTS cards (id serial PRIMARY KEY, title text NOT NULL)`
 *   - `create(t)`  → `INSERT INTO cards (title) VALUES ($1) RETURNING id, title`, mapped to CardRow
 *   - `list()`     → `SELECT id, title FROM cards ORDER BY id`, mapped to CardRow[]
 *
 * The test boots this against an EPHEMERAL Postgres container (`withEphemeralPostgres`) and drives
 * it with supertest — no mocks. Tests import from `solution/`; flip to `../src/...` to grade yours.
 */
import { Body, Controller, Get, Inject, Injectable, Module, Post } from "@nestjs/common";
import type { DynamicModule, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";

export const DATABASE_URL = "DATABASE_URL";
export const CARD_REPO = "CARD_REPO";

export interface CardRow {
  id: number;
  title: string;
}

export interface CardRepo {
  migrate(): Promise<void>;
  create(title: string): Promise<CardRow>;
  list(): Promise<CardRow[]>;
}

@Injectable()
export class PgCardRepo implements CardRepo, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(@Inject(DATABASE_URL) databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async migrate(): Promise<void> {
    throw new Error(
      "TODO: CREATE TABLE IF NOT EXISTS cards (id serial PRIMARY KEY, title text NOT NULL)",
    );
  }

  async create(_title: string): Promise<CardRow> {
    throw new Error("TODO: INSERT ... RETURNING id, title and map the row to a CardRow");
  }

  async list(): Promise<CardRow[]> {
    throw new Error("TODO: SELECT id, title FROM cards ORDER BY id and map to CardRow[]");
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Controller("cards")
export class CardsController {
  constructor(@Inject(CARD_REPO) private readonly repo: CardRepo) {}

  @Get()
  list(): Promise<CardRow[]> {
    return this.repo.list();
  }

  @Post()
  create(@Body() body: { title: string }): Promise<CardRow> {
    return this.repo.create(body.title);
  }
}

@Module({})
export class CardsModule {
  static forRoot(databaseUrl: string): DynamicModule {
    return {
      module: CardsModule,
      controllers: [CardsController],
      providers: [
        { provide: DATABASE_URL, useValue: databaseUrl },
        { provide: CARD_REPO, useClass: PgCardRepo },
      ],
    };
  }
}
