import { useId, type ReactElement, type ReactNode } from "react";

/**
 * YOUR TURN — build an accessible <Modal>. The a11y contract to satisfy:
 *   - render nothing when `open` is false
 *   - portal into `document.body`; the dialog box is
 *     `role="dialog" aria-modal="true" aria-labelledby={id}` with an <h2 id={id}>{title}</h2>
 *   - on open, move focus to the first focusable descendant
 *   - trap Tab / Shift+Tab inside (wrap first↔last)
 *   - close on `Escape` (call `onClose`)
 *   - on close/unmount, restore focus to whatever was focused when it opened
 *
 * Hints: `createPortal` from "react-dom"; a `document`-level `keydown` listener in a
 * `useEffect([open])` — depend on `open` ALONE, and read the latest `onClose` from a ref
 * (`const onCloseRef = useRef(onClose); onCloseRef.current = onClose;`) so an inline `onClose`
 * closure from the parent can't retrigger the effect and yank focus back on every re-render;
 * query focusables with a selector like
 * `'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'`;
 * stash `document.activeElement` on open and, in the cleanup, `.focus()` it back only if it's
 * still `.isConnected`.
 */

// Exported so the selector is easy to reuse/verify; keep it or inline your own.
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

export function Modal(_props: ModalProps): ReactElement | null {
  void useId;
  throw new Error("TODO: build the accessible, focus-trapping Modal");
}

export function Toast(_props: { message: string }): ReactElement {
  throw new Error("TODO: a role=status aria-live=polite toast");
}
