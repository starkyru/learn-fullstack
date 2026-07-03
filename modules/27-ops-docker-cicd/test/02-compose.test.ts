import { describe, expect, it } from "vitest";
import { buildComposeConfig, toYaml } from "../solution/02-compose.js";

describe("buildComposeConfig", () => {
  const cfg = buildComposeConfig();

  it("defines postgres on the pinned image with a pg_isready healthcheck", () => {
    expect(cfg.services.postgres.image).toBe("postgres:16-alpine");
    expect(cfg.services.postgres.healthcheck).toEqual({
      test: ["CMD-SHELL", "pg_isready -U app"],
      interval: "10s",
      timeout: "5s",
      retries: 5,
    });
    expect(cfg.services.postgres.volumes).toEqual(["pgdata:/var/lib/postgresql/data"]);
  });

  it("seeds the postgres credentials/database from the POSTGRES_* env block", () => {
    expect(cfg.services.postgres.environment).toEqual({
      POSTGRES_USER: "app",
      POSTGRES_PASSWORD: "app",
      POSTGRES_DB: "app",
    });
  });

  it("wires the api to build locally, expose :3000, and wait for a healthy postgres", () => {
    expect(cfg.services.api.build).toEqual({ context: ".", dockerfile: "Dockerfile" });
    expect(cfg.services.api.ports).toEqual(["3000:3000"]);
    expect(cfg.services.api.depends_on).toEqual({
      postgres: { condition: "service_healthy" },
    });
    expect(cfg.services.api.environment.DATABASE_URL).toBe(
      "postgres://app:app@postgres:5432/app",
    );
  });

  it("runs the api container in production mode", () => {
    expect(cfg.services.api.environment.NODE_ENV).toBe("production");
  });

  it("wires the web service to start after the api and points it at the api service DNS", () => {
    expect(cfg.services.web.depends_on).toEqual({
      api: { condition: "service_started" },
    });
    expect(cfg.services.web.ports).toEqual(["8080:80"]);
    expect(cfg.services.web.environment.API_URL).toBe("http://api:3000");
  });

  it("declares the named pgdata volume", () => {
    expect(cfg.volumes).toEqual({ pgdata: {} });
  });
});

describe("toYaml (hand-rolled serializer)", () => {
  it("serializes the compose object's key fields at the right indentation", () => {
    const yaml = toYaml(buildComposeConfig());
    expect(yaml).toContain('    image: "postgres:16-alpine"');
    expect(yaml).toContain('      - "pgdata:/var/lib/postgresql/data"');
    expect(yaml).toContain('        condition: "service_healthy"');
    expect(yaml).toContain("      retries: 5");
    expect(yaml).toContain("  pgdata: {}");
  });

  it("quotes scalars, prints numbers raw, and nests arrays of scalars under their key", () => {
    const yaml = toYaml({ name: "svc", replicas: 3, ports: ["80:80", "443:443"] });
    expect(yaml).toBe(
      ['name: "svc"', "replicas: 3", "ports:", '  - "80:80"', '  - "443:443"'].join("\n"),
    );
  });
});
