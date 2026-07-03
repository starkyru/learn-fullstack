import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * A play function drives a *mounted* story and asserts the result — the same pattern
 * `@storybook/test` runs in the Storybook UI. It gets the story's root DOM node
 * (`canvasElement`), queries it with Testing Library, acts with user-event, and throws if
 * the interaction contract is violated. Decoupled from the component: it only touches the DOM.
 */

export interface PlayContext {
  canvasElement: HTMLElement;
}

/** Drives an already-open Modal: verifies initial focus, the Tab trap, and Escape-to-close. */
export async function modalPlay({ canvasElement }: PlayContext): Promise<void> {
  const canvas = within(canvasElement);
  const dialog = canvas.getByRole("dialog");
  const buttons = within(dialog).getAllByRole("button");
  if (buttons.length < 2) {
    throw new Error("play: modal needs at least two focusables to exercise the trap");
  }
  const first = buttons[0]!;
  const last = buttons[buttons.length - 1]!;

  // 1. Focus should have moved into the dialog (onto the first focusable).
  if (document.activeElement !== first) {
    throw new Error("play: expected focus on the first focusable when the modal opens");
  }

  // 2. Tab from the last focusable must wrap back to the first (focus trap).
  last.focus();
  await userEvent.tab();
  if (document.activeElement !== first) {
    throw new Error("play: Tab escaped the modal — focus trap is broken");
  }

  // 3. Escape must close the dialog.
  await userEvent.keyboard("{Escape}");
  if (within(canvasElement).queryByRole("dialog") !== null) {
    throw new Error("play: Escape did not close the modal");
  }
}
