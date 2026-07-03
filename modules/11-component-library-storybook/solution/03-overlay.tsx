import { useEffect, useId, useRef, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * An accessible Modal. The a11y contract:
 *   - `role="dialog" aria-modal="true"` + `aria-labelledby` pointing at the title
 *   - focus moves INTO the dialog on open (first focusable)
 *   - Tab / Shift+Tab are TRAPPED inside (wrap at the ends)
 *   - `Escape` closes it
 *   - on close, focus is RESTORED to whatever was focused when it opened (the trigger)
 */

const FOCUSABLE_SELECTOR = [
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

export function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Keep the latest onClose in a ref so the effect below can depend on [open] ALONE. If it
  // depended on [onClose] and the parent passed an inline `() => …` (the common case), every
  // unrelated re-render would tear down and re-run the effect — yanking focus back to the first
  // element and wherever the user had tabbed. The ref severs that without going stale.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    // Remember the trigger so we can hand focus back when we close.
    restoreRef.current = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );

    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus on close/unmount — but only if the trigger is still in the DOM. If its
      // row was deleted while the modal was open, focusing a detached node is a silent no-op
      // that strands focus; let the browser fall back to <body> instead.
      const trigger = restoreRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 grid place-items-center bg-black/40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rounded-2xl bg-surface p-6 text-fg"
      >
        <h2 id={titleId} className="mb-3 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A polite live region: announced by screen readers without stealing focus. */
export function Toast({ message }: { message: string }): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg bg-surface px-3 py-2 text-fg"
    >
      {message}
    </div>
  );
}
