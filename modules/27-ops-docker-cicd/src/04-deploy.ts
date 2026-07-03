/**
 * Task 4 — Deploy (EXT).
 *
 * A deploy is an ORDERED plan, and the one ordering that must never break is: run database
 * migrations BEFORE you switch traffic to the new release — otherwise the freshly-released code can
 * hit a schema it expects but the DB hasn't got yet. `buildDeployPlan(target)` encodes that:
 * `build → migrate → release → verify`, with the `migrate` step always ahead of `release`.
 *
 * The Kanban web app deploys to Vercel; the chat API deploys to Railway or Fly. A deploy also needs
 * its secrets present, so `validateSecrets(target, provided)` is a fail-closed checklist: it returns
 * `{ ok, missing }` — `ok` only when every required secret is a non-empty string.
 *
 * EXT: this file ships complete — read the plan + validator, then extend it (add a target, a step,
 * a required secret). Pure functions, no clock/randomness, fully asserted by the test.
 */

/** Where a service deploys. Vercel = Kanban web; Railway/Fly = chat API. */
export type DeployTarget = "vercel" | "railway" | "fly";

export interface DeployStep {
  /** Stable id used to assert ordering (`migrate` must precede `release`). */
  id: string;
  /** The shell command the CD job runs for this step. */
  run: string;
  /** Human-readable intent. */
  description: string;
}

export interface SecretsResult {
  ok: boolean;
  missing: string[];
}

/** The app each target ships. */
function appFor(target: DeployTarget): "kanban" | "chat-api" {
  return target === "vercel" ? "kanban" : "chat-api";
}

/** The target-specific "switch traffic" step — this is what `migrate` must come before. */
function releaseStep(target: DeployTarget): DeployStep {
  switch (target) {
    case "vercel":
      return {
        id: "release",
        run: "vercel deploy --prebuilt --prod",
        description: "Promote the Kanban web build to production on Vercel",
      };
    case "railway":
      return {
        id: "release",
        run: "railway up --service chat-api",
        description: "Release the chat API on Railway",
      };
    case "fly":
      return {
        id: "release",
        run: "flyctl deploy --remote-only",
        description: "Release the chat API on Fly.io",
      };
  }
}

/**
 * Build the ordered deploy plan for a target. Invariant: the `migrate` step is always positioned
 * before the `release` step, so migrations apply before any traffic reaches the new code.
 */
export function buildDeployPlan(target: DeployTarget): DeployStep[] {
  const app = appFor(target);
  return [
    {
      id: "build",
      run: `pnpm turbo run build --filter=@learn-fullstack/${app}...`,
      description: `Build the ${app} bundle with turbo`,
    },
    {
      id: "migrate",
      run: "pnpm prisma migrate deploy",
      description: "Run database migrations BEFORE switching traffic",
    },
    releaseStep(target),
    {
      id: "verify",
      run: "curl -fsS https://$DEPLOY_HOST/healthz",
      description: "Smoke-test the new release before considering the deploy done",
    },
  ];
}

/** Secrets each target requires in CD. `DATABASE_URL` is shared; the token is provider-specific. */
export const REQUIRED_SECRETS: Record<DeployTarget, readonly string[]> = {
  vercel: ["DATABASE_URL", "VERCEL_TOKEN"],
  railway: ["DATABASE_URL", "RAILWAY_TOKEN"],
  fly: ["DATABASE_URL", "FLY_API_TOKEN"],
};

/**
 * Fail-closed secrets checklist: `ok` is true only when every required secret for `target` is
 * present and non-empty; otherwise `missing` lists exactly the ones that are absent/blank.
 */
export function validateSecrets(
  target: DeployTarget,
  provided: Record<string, string | undefined>,
): SecretsResult {
  const required = REQUIRED_SECRETS[target];
  const missing = required.filter((key) => {
    const value = provided[key];
    return value === undefined || value === "";
  });
  return { ok: missing.length === 0, missing };
}
