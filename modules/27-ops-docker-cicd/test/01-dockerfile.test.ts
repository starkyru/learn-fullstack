import { describe, expect, it } from "vitest";
import {
  buildApiDockerfile,
  buildDockerfile,
  buildWorkerDockerfile,
} from "../solution/01-dockerfile.js";

/** Index of a substring; -1 if absent. Used to assert stage ORDER. */
function at(text: string, needle: string): number {
  return text.indexOf(needle);
}

describe("buildApiDockerfile (chat API, WORKED)", () => {
  const df = buildApiDockerfile();

  it("emits the three stages in deps → build → runtime order", () => {
    const deps = at(df, "FROM node:20-alpine AS deps");
    const build = at(df, "FROM node:20-alpine AS build");
    const runtime = at(df, "FROM node:20-alpine AS runtime");
    expect(deps).toBeGreaterThanOrEqual(0);
    expect(build).toBeGreaterThan(deps);
    expect(runtime).toBeGreaterThan(build);
  });

  it("installs from manifests in deps and copies the build output from the build stage", () => {
    expect(df).toContain("COPY package.json package-lock.json ./");
    expect(df).toContain("RUN npm ci");
    expect(df).toContain("COPY --from=build /app/dist ./dist");
  });

  it("drops to a non-root user and exposes an HTTP healthcheck on the API port", () => {
    expect(df).toContain("USER node");
    expect(df).toContain("EXPOSE 3000");
    expect(df).toContain(
      "HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:3000/healthz || exit 1",
    );
  });

  it("runs the API entrypoint via an exec-form CMD", () => {
    expect(df).toContain('CMD ["node", "dist/main.js"]');
    expect(at(df, "USER node")).toBeLessThan(at(df, 'CMD ["node", "dist/main.js"]'));
  });

  it("bakes NODE_ENV=production and copies node_modules from the deps stage in runtime", () => {
    expect(df).toContain("ENV NODE_ENV=production");
    expect(df).toContain("COPY --from=deps /app/node_modules ./node_modules");
    // the runtime node_modules copy comes from deps, before the USER drop
    expect(at(df, "COPY --from=deps /app/node_modules ./node_modules")).toBeLessThan(
      at(df, "USER node"),
    );
  });
});

describe("buildWorkerDockerfile (analog worker)", () => {
  const df = buildWorkerDockerfile();

  it("keeps the same three-stage, non-root shape", () => {
    expect(at(df, "FROM node:20-alpine AS deps")).toBeGreaterThanOrEqual(0);
    expect(at(df, "FROM node:20-alpine AS build")).toBeGreaterThan(
      at(df, "FROM node:20-alpine AS deps"),
    );
    expect(at(df, "FROM node:20-alpine AS runtime")).toBeGreaterThan(
      at(df, "FROM node:20-alpine AS build"),
    );
    expect(df).toContain("USER node");
    expect(df).toContain('CMD ["node", "dist/worker.js"]');
  });

  it("has NO HTTP surface: no EXPOSE and no HEALTHCHECK", () => {
    expect(df).not.toContain("EXPOSE");
    expect(df).not.toContain("HEALTHCHECK");
  });
});

describe("buildDockerfile engine", () => {
  it("omits EXPOSE/HEALTHCHECK when no port is given but always sets USER and CMD", () => {
    const df = buildDockerfile({ image: "node:22-alpine", cmd: ["node", "index.js"] });
    expect(df).toContain("FROM node:22-alpine AS runtime");
    expect(df).toContain("USER node");
    expect(df).toContain('CMD ["node", "index.js"]');
    expect(df).not.toContain("EXPOSE");
    expect(df).not.toContain("HEALTHCHECK");
  });

  it("respects a custom non-root user and port/health path", () => {
    const df = buildDockerfile({
      image: "node:20-slim",
      user: "app",
      port: 8080,
      healthPath: "/ready",
      cmd: ["node", "server.js"],
    });
    expect(df).toContain("USER app");
    expect(df).toContain("EXPOSE 8080");
    expect(df).toContain("http://localhost:8080/ready");
  });
});
