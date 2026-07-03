/**
 * Task 4 — E2E (reference solution).
 *
 * A real E2E test drives a browser, which no CI gate should do at unit-test time. So we split the
 * concern: the ORCHESTRATION (the ordered steps of "log in → create card → see it") is pure data
 * produced by `cardFlowSteps`, and `runFlow` walks those steps against ANY `E2EDriver`. In CI the
 * driver is Playwright (see `e2e/card-flow.spec.ts`); in this unit test it's a fake recorder. Same
 * steps, same runner, no browser — the flow logic is fully covered while the browser stays an
 * artifact the gate never launches.
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

/** The E2E scenario as data: log in, land on the board, add a card, assert it shows up. */
export function cardFlowSteps(input: CardFlowInput): FlowStep[] {
  const { baseUrl, username, password, cardTitle } = input;
  return [
    { kind: "goto", url: `${baseUrl}/login` },
    { kind: "fill", selector: "#username", value: username },
    { kind: "fill", selector: "#password", value: password },
    { kind: "click", selector: "button[type=submit]" },
    { kind: "goto", url: `${baseUrl}/board` },
    { kind: "fill", selector: "#new-card", value: cardTitle },
    { kind: "click", selector: "button[name=add-card]" },
    { kind: "expectText", selector: "[data-testid=board]", text: cardTitle },
  ];
}

/**
 * Execute `steps` in order against a `driver`. `expectText` reads the DOM through the driver and
 * throws if the target text is absent — so a failed assertion rejects the returned promise.
 */
export async function runFlow(
  driver: E2EDriver,
  steps: readonly FlowStep[],
): Promise<void> {
  for (const step of steps) {
    switch (step.kind) {
      case "goto":
        await driver.goto(step.url);
        break;
      case "fill":
        await driver.fill(step.selector, step.value);
        break;
      case "click":
        await driver.click(step.selector);
        break;
      case "expectText": {
        const actual = await driver.textOf(step.selector);
        if (!actual.includes(step.text)) {
          throw new Error(
            `expectText failed: ${step.selector} — expected to contain "${step.text}", got "${actual}"`,
          );
        }
        break;
      }
    }
  }
}
