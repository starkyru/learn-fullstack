/**
 * Task 5 — When-to-use note (EXT).
 *
 * Two shipped-whole pieces: (1) `testingTrophyNote`, the "which test tier, and how much" reference,
 * and (2) a CONTRACT test — the thing that keeps a decoupled consumer and provider honest without a
 * running integration. The consumer (Board) states its expectation as a shared schema; the provider
 * (the Nest API from Task 3) must satisfy it. `verifyProvider` runs that check: a conforming
 * response passes, a shape-drifted one fails with the offending paths — which is exactly the
 * regression a mocked component test alone would MISS.
 *
 * EXT ships complete in both `src/` and `solution/`: read it, then extend it (add a field to the
 * contract and watch a stale provider fail).
 */
import { z } from "zod";

export const testingTrophyNote = `# The Testing Trophy — when to use what

Kent C. Dodds' trophy, from base (widest) to tip (narrowest):

1. Static — types + lint. Free, instant, catches typos and shape drift before a test runs.
2. Unit — pure functions & reducers (Task 1). Fast and plentiful; the base of the trophy.
3. Integration — real modules wired together, real Postgres (Task 3). The BIGGEST slab: the best
   ratio of confidence to cost, because it exercises the seams where bugs actually live.
4. End-to-end — a browser driving the whole app (Task 4). Highest confidence, slowest & flakiest,
   so keep a few smoke paths, not hundreds.

Rule of thumb: "Write tests. Not too many. Mostly integration." Mock only true boundaries
(network, clock, fs) — never the unit under test. A contract test guards the seam between a
consumer and a provider that unit tests mock apart.`;

/** The shape the Board consumer relies on — the shared contract between consumer and provider. */
export const cardContract = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
});

export type CardContract = z.infer<typeof cardContract>;

export type ContractResult =
  { ok: true; value: CardContract } | { ok: false; issues: string[] };

/**
 * Provider verification: does `response` satisfy the consumer's contract? Returns the parsed value
 * on success, or the list of `path: message` violations on failure (so a mismatch is actionable).
 */
export function verifyProvider(response: unknown): ContractResult {
  const parsed = cardContract.safeParse(response);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    issues: parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    ),
  };
}

/** A stand-in for the Task 3 provider's response, so the contract test has a provider to verify. */
export function providerResponse(title: string): CardContract {
  return { id: 1, title };
}
