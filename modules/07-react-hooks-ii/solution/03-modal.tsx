import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";

export interface ModalHandle {
  focus: () => void;
}

// React 19: `ref` can be a normal prop (no forwardRef needed).
export function Modal({
  ref,
  children,
}: {
  ref?: Ref<ModalHandle>;
  children?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => closeRef.current?.focus() }), []);
  return createPortal(
    <div role="dialog">
      <button type="button" ref={closeRef}>
        Close
      </button>
      {children}
    </div>,
    document.body,
  );
}
