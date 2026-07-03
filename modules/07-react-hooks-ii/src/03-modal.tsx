import type { ReactNode, Ref } from "react";

export interface ModalHandle {
  focus: () => void;
}

/**
 * YOUR TURN — a Modal rendered into `document.body` via `createPortal`, exposing an
 * imperative `focus()` (which focuses its Close button) through `useImperativeHandle`.
 * Accept a `ref: Ref<ModalHandle>`. Render role="dialog" with a <button>Close</button>.
 */
export function Modal(_props: { ref?: Ref<ModalHandle>; children?: ReactNode }) {
  throw new Error("TODO: createPortal + useImperativeHandle({ focus }) + a Close button");
}
