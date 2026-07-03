/**
 * Task 3 — CI pipeline (TODO).
 *
 * Return a typed GitHub Actions workflow object — one `build` job whose steps run in the order
 * install → typecheck → lint → test → build, over a Node version matrix, with a turbo remote/local
 * cache step — then serialize it with the same hand-rolled `toYaml`. A `.github/workflows/ci.yml`
 * artifact is checked in. Pure data/string transform: no clock, no randomness.
 */

export interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
}

export interface BuildJob {
  "runs-on": string;
  strategy: { matrix: { node: number[] } };
  steps: WorkflowStep[];
}

export interface CIWorkflow {
  name: string;
  on: { push: { branches: string[] }; pull_request: Record<string, never> };
  jobs: { build: BuildJob };
}

/**
 * YOUR TURN — return the workflow object with EXACTLY this shape:
 *   - name "CI"; on { push: { branches: ["main"] }, pull_request: {} }.
 *   - jobs.build["runs-on"] "ubuntu-latest"; strategy.matrix.node [20, 22].
 *   - jobs.build.steps in THIS order (names must match, this is what the test asserts):
 *       1. { name: "Checkout", uses: "actions/checkout@v4" }
 *       2. { name: "Setup pnpm", uses: "pnpm/action-setup@v4" }
 *       3. { name: "Setup Node", uses: "actions/setup-node@v4",
 *            with: { "node-version": "${{ matrix.node }}", cache: "pnpm" } }
 *       4. { name: "Cache turbo", uses: "actions/cache@v4",
 *            with: { path: ".turbo",
 *                    key: "${{ runner.os }}-turbo-${{ github.sha }}",
 *                    "restore-keys": "${{ runner.os }}-turbo-" } }
 *       5. { name: "Install",   run: "pnpm install --frozen-lockfile" }
 *       6. { name: "Typecheck", run: "pnpm turbo run typecheck" }
 *       7. { name: "Lint",      run: "pnpm turbo run lint" }
 *       8. { name: "Test",      run: "pnpm turbo run test" }
 *       9. { name: "Build",     run: "pnpm turbo run build" }
 */
export function buildCIWorkflow(): CIWorkflow {
  throw new Error(
    "TODO: return the CI workflow (install→typecheck→lint→test→build, node matrix, turbo cache)",
  );
}

/**
 * YOUR TURN — the same minimal block-style YAML serializer as task 2, but it must also handle an
 * array of records (the `steps` list): render the first key of a record item on the `- ` line and
 * indent the remaining keys to align. Return the joined string WITHOUT a trailing newline.
 */
export function toYaml(_value: unknown, _indent = 0): string {
  throw new Error(
    "TODO: implement the block-style YAML serializer (must support arrays of records)",
  );
}
