import { describe, expect, it } from "vitest";
import { buildDeployPlan, validateSecrets } from "../solution/04-deploy.js";

describe("buildDeployPlan", () => {
  it("orders every plan build → migrate → release → verify (migrate BEFORE release)", () => {
    for (const target of ["vercel", "railway", "fly"] as const) {
      const ids = buildDeployPlan(target).map((step) => step.id);
      expect(ids).toEqual(["build", "migrate", "release", "verify"]);
      expect(ids.indexOf("migrate")).toBeLessThan(ids.indexOf("release"));
    }
  });

  it("deploys the Kanban web app to Vercel", () => {
    const plan = buildDeployPlan("vercel");
    expect(plan.find((s) => s.id === "release")?.run).toBe(
      "vercel deploy --prebuilt --prod",
    );
    expect(plan.find((s) => s.id === "build")?.run).toContain("kanban");
  });

  it("deploys the chat API to Railway and Fly respectively", () => {
    expect(buildDeployPlan("railway").find((s) => s.id === "release")?.run).toBe(
      "railway up --service chat-api",
    );
    expect(buildDeployPlan("fly").find((s) => s.id === "release")?.run).toBe(
      "flyctl deploy --remote-only",
    );
    expect(buildDeployPlan("railway").find((s) => s.id === "build")?.run).toContain(
      "chat-api",
    );
  });

  it("always runs prisma migrate deploy as the migrate step", () => {
    expect(buildDeployPlan("fly").find((s) => s.id === "migrate")?.run).toBe(
      "pnpm prisma migrate deploy",
    );
  });
});

describe("validateSecrets", () => {
  it("passes when every required secret is present and non-empty", () => {
    const result = validateSecrets("railway", {
      DATABASE_URL: "postgres://app:app@db:5432/app",
      RAILWAY_TOKEN: "rw_live_xxx",
    });
    expect(result).toEqual({ ok: true, missing: [] });
  });

  it("fails closed and lists exactly the missing/blank secrets", () => {
    const result = validateSecrets("vercel", {
      DATABASE_URL: "",
      VERCEL_TOKEN: undefined,
    });
    expect(result).toEqual({ ok: false, missing: ["DATABASE_URL", "VERCEL_TOKEN"] });
  });

  it("names the provider-specific token per target", () => {
    const result = validateSecrets("fly", { DATABASE_URL: "postgres://x" });
    expect(result).toEqual({ ok: false, missing: ["FLY_API_TOKEN"] });
  });
});
