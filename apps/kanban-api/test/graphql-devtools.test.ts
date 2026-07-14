import { describe, expect, it } from "vitest";
import { graphqlDevToolsEnabled } from "../src/graphql-devtools.js";

// The GraphQL explorer + introspection gate must be DEFAULT-DENY: only an explicit development/test
// environment enables it. Anything else — including an unset or empty NODE_ENV — must be false, so a
// deployment that forgets to set NODE_ENV=production never exposes the schema.
describe("graphqlDevToolsEnabled — default-deny GraphQL dev-tooling gate", () => {
  it("enables only for explicit development/test", () => {
    expect(graphqlDevToolsEnabled("development")).toBe(true);
    expect(graphqlDevToolsEnabled("test")).toBe(true);
  });

  it("fails closed for production, staging, unset, empty, and malformed values", () => {
    for (const env of [
      "production",
      "staging",
      "prod",
      "Development",
      "TEST",
      " development ",
      "",
      undefined,
    ]) {
      expect(graphqlDevToolsEnabled(env)).toBe(false);
    }
  });
});
