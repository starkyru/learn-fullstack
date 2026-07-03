/**
 * Task 4 — E2E (TODO).
 *
 * The browser part ships as an artifact (`e2e/card-flow.spec.ts` + `playwright.config.ts`) the gate
 * never runs. Your job is the TESTABLE core: express the E2E scenario as ORDERED DATA and a runner.
 *
 *   - `cardFlowSteps(input)` → the exact ordered steps of: goto /login, fill #username & #password,
 *     click submit, goto /board, fill #new-card, click the add button, then `expectText` that the
 *     board (`[data-testid=board]`) contains the new card title.
 *   - `runFlow(driver, steps)` → walk the steps against ANY `E2EDriver`; for `expectText`, read via
 *     `driver.textOf(selector)` and THROW if the text is missing (so a failed assertion rejects).
 *
 * The unit test runs `runFlow` against a fake recording driver — no browser. Tests import from
 * `solution/`; flip to `../src/...` to grade your own build.
 */

export interface E2EDriver {
  goto(url: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  click(selector: string): Promise<void>;
  textOf(selector: string): Promise<string>;
}

export interface CardFlowInput {
  baseUrl: string;
  username: string;
  password: string;
  cardTitle: string;
}

export type FlowStep =
  | { kind: "goto"; url: string }
  | { kind: "fill"; selector: string; value: string }
  | { kind: "click"; selector: string }
  | { kind: "expectText"; selector: string; text: string };

export function cardFlowSteps(_input: CardFlowInput): FlowStep[] {
  throw new Error(
    "TODO: return the ordered steps: login → goto board → add card → expectText title",
  );
}

export async function runFlow(
  _driver: E2EDriver,
  _steps: readonly FlowStep[],
): Promise<void> {
  throw new Error(
    "TODO: execute each step against the driver; expectText throws when text is absent",
  );
}
