import { describe, expect, it } from "vitest";
import { buildCIWorkflow, toYaml } from "../solution/03-ci.js";

describe("buildCIWorkflow", () => {
  const wf = buildCIWorkflow();

  it("triggers on push to main and on pull_request, over a Node 20/22 matrix", () => {
    expect(wf.name).toBe("CI");
    expect(wf.on.push.branches).toEqual(["main"]);
    expect(wf.on.pull_request).toEqual({});
    expect(wf.jobs.build["runs-on"]).toBe("ubuntu-latest");
    expect(wf.jobs.build.strategy.matrix.node).toEqual([20, 22]);
  });

  it("runs the pipeline steps in exactly this order", () => {
    const names = wf.jobs.build.steps.map((step) => step.name);
    expect(names).toEqual([
      "Checkout",
      "Setup pnpm",
      "Setup Node",
      "Cache turbo",
      "Install",
      "Typecheck",
      "Lint",
      "Test",
      "Build",
    ]);
  });

  it("keeps the quality gates in install → typecheck → lint → test → build order", () => {
    const names = wf.jobs.build.steps.map((s) => s.name);
    const idx = (name: string): number => names.indexOf(name);
    expect(idx("Install")).toBeGreaterThanOrEqual(0);
    expect(idx("Install")).toBeLessThan(idx("Typecheck"));
    expect(idx("Typecheck")).toBeLessThan(idx("Lint"));
    expect(idx("Lint")).toBeLessThan(idx("Test"));
    expect(idx("Test")).toBeLessThan(idx("Build"));
    expect(wf.jobs.build.steps.find((s) => s.name === "Build")?.run).toBe(
      "pnpm turbo run build",
    );
  });

  it("runs each quality gate via its exact turbo command", () => {
    const runOf = (name: string): string | undefined =>
      wf.jobs.build.steps.find((s) => s.name === name)?.run;
    expect(runOf("Typecheck")).toBe("pnpm turbo run typecheck");
    expect(runOf("Lint")).toBe("pnpm turbo run lint");
    expect(runOf("Test")).toBe("pnpm turbo run test");
  });

  it("sets up Node from the matrix with the pnpm cache", () => {
    const setupNode = wf.jobs.build.steps.find((s) => s.name === "Setup Node");
    expect(setupNode?.uses).toBe("actions/setup-node@v4");
    expect(setupNode?.with).toEqual({
      "node-version": "${{ matrix.node }}",
      cache: "pnpm",
    });
  });

  it("caches the turbo dir with a git-sha key and a fallback restore-key", () => {
    const cache = wf.jobs.build.steps.find((s) => s.name === "Cache turbo");
    expect(cache?.uses).toBe("actions/cache@v4");
    expect(cache?.with).toEqual({
      path: ".turbo",
      key: "${{ runner.os }}-turbo-${{ github.sha }}",
      "restore-keys": "${{ runner.os }}-turbo-",
    });
  });
});

describe("toYaml over the workflow (arrays of records)", () => {
  const yaml = toYaml(buildCIWorkflow());

  it("renders the step list with the first key on the dash line", () => {
    expect(yaml).toContain('      - name: "Install"');
    expect(yaml).toContain('        run: "pnpm install --frozen-lockfile"');
  });

  it("serializes the turbo cache key inside the nested with block", () => {
    expect(yaml).toContain('          key: "${{ runner.os }}-turbo-${{ github.sha }}"');
  });
});
