/**
 * Task 5 — Mini query builder (no Prisma/Drizzle/Knex).
 *
 * A tiny fluent builder: `from("cards").select(["id","title"]).where("list_id","=",5).limit(10)`
 * compiles to a parameterized `{ text, values }`. The whole point is SQL-injection safety:
 *
 *  - VALUES are never interpolated — each becomes a `$n` placeholder pushed onto `values`, so a
 *    `'); DROP TABLE users; --` payload lands as a bound param, not executable SQL.
 *  - IDENTIFIERS (table/column names) CANNOT be bound params in SQL, so they're validated against a
 *    strict `[A-Za-z_][A-Za-z0-9_]*` allowlist and rejected otherwise.
 *  - `limit` is validated as a non-negative integer before it's inlined.
 */

export type Op = "=" | "!=" | "<" | "<=" | ">" | ">=" | "LIKE";
export type Sql = { text: string; values: unknown[] };

const OPS: readonly Op[] = ["=", "!=", "<", "<=", ">", ">=", "LIKE"];
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertIdent(name: string): void {
  if (!IDENT.test(name)) {
    throw new Error(`invalid SQL identifier: ${JSON.stringify(name)}`);
  }
}

function assertOp(op: Op): void {
  if (!OPS.includes(op)) {
    throw new Error(`invalid operator: ${JSON.stringify(op)}`);
  }
}

export interface QueryBuilder {
  select(cols: string[]): QueryBuilder;
  where(col: string, op: Op, val: unknown): QueryBuilder;
  limit(n: number): QueryBuilder;
  toSQL(): Sql;
}

type Condition = { col: string; op: Op; val: unknown };

class Builder implements QueryBuilder {
  private cols: string[] = ["*"];
  private conditions: Condition[] = [];
  private limitValue: number | undefined = undefined;

  constructor(private readonly table: string) {
    assertIdent(table);
  }

  select(cols: string[]): QueryBuilder {
    for (const col of cols) assertIdent(col);
    this.cols = cols.length > 0 ? cols : ["*"];
    return this;
  }

  where(col: string, op: Op, val: unknown): QueryBuilder {
    assertIdent(col);
    assertOp(op);
    this.conditions.push({ col, op, val });
    return this;
  }

  limit(n: number): QueryBuilder {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`invalid limit: ${String(n)}`);
    }
    this.limitValue = n;
    return this;
  }

  toSQL(): Sql {
    const values: unknown[] = [];
    let text = `SELECT ${this.cols.join(", ")} FROM ${this.table}`;

    if (this.conditions.length > 0) {
      const parts = this.conditions.map((cond) => {
        values.push(cond.val);
        return `${cond.col} ${cond.op} $${values.length}`;
      });
      text += ` WHERE ${parts.join(" AND ")}`;
    }

    if (this.limitValue !== undefined) {
      text += ` LIMIT ${this.limitValue}`;
    }

    return { text, values };
  }
}

/** Entry point: start a query against `table`. */
export function from(table: string): QueryBuilder {
  return new Builder(table);
}
