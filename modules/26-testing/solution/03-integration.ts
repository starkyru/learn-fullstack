/**
 * Task 3 — Integration (reference solution).
 *
 * A tiny Nest slice whose repository talks to a REAL Postgres over `pg`. No in-memory fake, no
 * mocked pool: the integration test boots this module against an EPHEMERAL Postgres container
 * (`withEphemeralPostgres` from `@learn-fullstack/testing`) and drives it over HTTP with supertest.
 * That is the whole value of the integration tier — the SQL, the driver, the DI wiring and the
 * controller are all exercised together, so a broken query or a bad column mapping actually fails.
 *
 * The connection string is injected via the `DATABASE_URL` token by `CardsModule.forRoot(url)`, so
 * the test hands in the throwaway container's URL and nothing is hard-coded.
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
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS cards (id serial PRIMARY KEY, title text NOT NULL)",
    );
  }

  async create(title: string): Promise<CardRow> {
    const result = await this.pool.query(
      "INSERT INTO cards (title) VALUES ($1) RETURNING id, title",
      [title],
    );
    const row = result.rows[0];
    if (!row) throw new Error("INSERT ... RETURNING produced no row");
    return { id: Number(row.id), title: String(row.title) };
  }

  async list(): Promise<CardRow[]> {
    const result = await this.pool.query("SELECT id, title FROM cards ORDER BY id");
    return result.rows.map((row): CardRow => ({
      id: Number(row.id),
      title: String(row.title),
    }));
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
