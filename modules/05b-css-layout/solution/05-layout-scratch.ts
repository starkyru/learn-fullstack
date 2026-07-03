/**
 * A from-scratch modal + responsive board, expressed as the `{ className, style }` layout nodes a
 * component spreads. Pure CSS logic — the centering, the overlay, the responsive column track — with
 * no framework. The hand-written CSS lives in `artifacts/` (board.css / modal.css).
 */

export interface LayoutNode {
  className: string;
  style: Record<string, string>;
}

export interface ModalLayout {
  overlay: LayoutNode;
  dialog: LayoutNode;
}

export interface ModalOptions {
  open: boolean;
  width?: number;
}

export function buildModal({ open, width = 480 }: ModalOptions): ModalLayout {
  return {
    overlay: {
      className: open ? "modal-overlay modal-overlay--open" : "modal-overlay",
      style: {
        position: "fixed",
        inset: "0",
        display: open ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
      },
    },
    dialog: {
      className: "modal-dialog",
      style: {
        width: `min(${width}px, calc(100vw - 32px))`,
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
      },
    },
  };
}

export function buildBoard(columnCount: number): LayoutNode {
  return {
    className: "board",
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${columnCount}, minmax(272px, 1fr))`,
      gap: "16px",
      overflowX: "auto",
    },
  };
}
