import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * A play function drives a *mounted* story and asserts the result — the same pattern
 * `@storybook/test` runs in the Storybook UI. It gets the story's root DOM node
 * (`canvasElement`), queries it with Testing Library, acts with user-event, and throws if
 * the interaction contract is violated.
 *
 * YOUR TURN — write `modalPlay` against an already-open Modal:
 *   1. `within(canvasElement).getByRole("dialog")`; collect its buttons.
 *   2. Assert focus is on the FIRST focusable (throw if not).
 *   3. Focus the LAST, `await userEvent.tab()`, assert focus WRAPPED to the first (the trap).
 *   4. `await userEvent.keyboard("{Escape}")`, assert the dialog is gone.
 * Throw a descriptive Error on any violation; resolve (return) when all hold.
 */

export interface PlayContext {
  canvasElement: HTMLElement;
}

export async function modalPlay(_ctx: PlayContext): Promise<void> {
  void within;
  void userEvent;
  throw new Error("TODO: assert focus trap + Escape-close on the mounted modal");
}
