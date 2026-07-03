import { describe, expect, it } from "vitest";
import { from } from "../solution/05-query-builder.js";

describe("query builder — parameterized SQL", () => {
  it("defaults select to * with no where/limit", () => {
    expect(from("cards").toSQL()).toEqual({ text: "SELECT * FROM cards", values: [] });
  });

  it("emits explicit columns, a single bound where, and an inlined limit", () => {
    const sql = from("cards")
      .select(["id", "title"])
      .where("list_id", "=", 5)
      .limit(10)
      .toSQL();
    expect(sql).toEqual({
      text: "SELECT id, title FROM cards WHERE list_id = $1 LIMIT 10",
      values: [5],
    });
  });

  it("chains multiple where() calls with AND and incrementing placeholders", () => {
    const sql = from("cards")
      .where("list_id", "=", 2)
      .where("position", ">", 3)
      .where("title", "LIKE", "%sql%")
      .toSQL();
    expect(sql).toEqual({
      text: "SELECT * FROM cards WHERE list_id = $1 AND position > $2 AND title LIKE $3",
      values: [2, 3, "%sql%"],
    });
  });

  it("binds a SQL-injection payload as a value — never interpolates it into the text", () => {
    const payload = "x'); DROP TABLE users; --";
    const sql = from("users").where("name", "=", payload).toSQL();

    expect(sql).toEqual({
      text: "SELECT * FROM users WHERE name = $1",
      values: [payload],
    });
    // The dangerous string lives only in `values`, so the driver sends it as data, not SQL.
    expect(sql.text).not.toContain("DROP");
    expect(sql.text).not.toContain(payload);
  });

  it("rejects an injection attempt hidden in a table or column identifier", () => {
    expect(() => from("users; DROP TABLE users")).toThrow(/invalid SQL identifier/);
    expect(() => from("cards").select(["id; --"])).toThrow(/invalid SQL identifier/);
    expect(() => from("cards").where("1=1; DROP", "=", 1)).toThrow(
      /invalid SQL identifier/,
    );
  });

  it("rejects a non-integer or negative limit", () => {
    expect(() => from("cards").limit(1.5)).toThrow(/invalid limit/);
    expect(() => from("cards").limit(-1)).toThrow(/invalid limit/);
  });
});
