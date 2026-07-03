/**
 * FROM SCRATCH — rebuild a real UI (a modal + a responsive board) in pure CSS, expressed as the
 * `{ className, style }` layout nodes a component would spread. No Tailwind, no UI kit: you own the
 * centering, the overlay, the responsive column track. Ship the matching hand-written CSS in
 * `artifacts/` (board.css / modal.css) — the gate only checks the composed structure here.
 *
 * Implement both builders (they currently throw):
 *
 *   buildModal({ open, width = 480 }):
 *     overlay: a FIXED, inset:0 flex centering box that only DISPLAYS when open.
 *       className: open ? "modal-overlay modal-overlay--open" : "modal-overlay"
 *       style: { position: "fixed", inset: "0", display: open ? "flex" : "none",
 *                alignItems: "center", justifyContent: "center", background: "rgba(0, 0, 0, 0.5)" }
 *     dialog: a width-capped, scrollable panel.
 *       className: "modal-dialog"
 *       style: { width: `min(${width}px, calc(100vw - 32px))`,
 *                maxHeight: "calc(100vh - 32px)", overflow: "auto" }
 *
 *   buildBoard(columnCount):
 *     className: "board"
 *     style: { display: "grid", gridTemplateColumns: `repeat(${columnCount}, minmax(272px, 1fr))`,
 *              gap: "16px", overflowX: "auto" }
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

export function buildModal(_options: ModalOptions): ModalLayout {
  throw new Error("TODO: build the { overlay, dialog } modal layout nodes");
}

export function buildBoard(_columnCount: number): LayoutNode {
  throw new Error("TODO: build the responsive board grid node");
}
