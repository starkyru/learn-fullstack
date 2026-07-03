/**
 * Task 5 — Mini query builder (FROM SCRATCH, no Prisma/Drizzle/Knex).
 *
 * Build a tiny fluent builder so
 *   `from("cards").select(["id","title"]).where("list_id","=",5).limit(10).toSQL()`
 * returns `{ text: "SELECT id, title FROM cards WHERE list_id = $1 LIMIT 10", values: [5] }`.
 *
 * Rules that make it injection-safe:
 *  - VALUES are never interpolated — each `where(...)` value becomes a `$n` placeholder pushed onto
 *    `values`. Multiple `where(...)` calls join with ` AND `.
 *  - IDENTIFIERS (table + column names) can't be bound params, so validate them against
 *    `^[A-Za-z_][A-Za-z0-9_]*$` and throw on anything else.
 *  - `limit(n)` must be a non-negative integer before it's inlined.
 *  - `select([])` (or never calling it) defaults to `*`.
 */

export type Op = "=" | "!=" | "<" | "<=" | ">" | ">=" | "LIKE";
export type Sql = { text: string; values: unknown[] };

export interface QueryBuilder {
  select(cols: string[]): QueryBuilder;
  where(col: string, op: Op, val: unknown): QueryBuilder;
  limit(n: number): QueryBuilder;
  toSQL(): Sql;
}

export function from(_table: string): QueryBuilder {
  throw new Error(
    "TODO: implement the fluent builder — toSQL() returns { text, values } with $n placeholders",
  );
}
