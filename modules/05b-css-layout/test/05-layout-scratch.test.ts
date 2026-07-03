import { describe, expect, it } from "vitest";
import { buildBoard, buildModal } from "../solution/05-layout-scratch.js";

describe("buildModal (from-scratch overlay + dialog)", () => {
  it("centers a fixed, hidden overlay when closed", () => {
    const { overlay } = buildModal({ open: false });
    expect(overlay).toEqual({
      className: "modal-overlay",
      style: {
        position: "fixed",
        inset: "0",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
      },
    });
  });

  it("shows the overlay and adds the open modifier when open", () => {
    const { overlay } = buildModal({ open: true });
    expect(overlay.className).toBe("modal-overlay modal-overlay--open");
    expect(overlay.style.display).toBe("flex");
  });

  it("caps the dialog width with min(...) against the viewport and defaults to 480", () => {
    expect(buildModal({ open: true }).dialog).toEqual({
      className: "modal-dialog",
      style: {
        width: "min(480px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
      },
    });
  });

  it("threads a custom width into the dialog min()", () => {
    expect(buildModal({ open: true, width: 640 }).dialog.style.width).toBe(
      "min(640px, calc(100vw - 32px))",
    );
  });
});

describe("buildBoard (responsive grid)", () => {
  it("lays columns on a min-272 grid track with horizontal scroll", () => {
    expect(buildBoard(4)).toEqual({
      className: "board",
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(272px, 1fr))",
        gap: "16px",
        overflowX: "auto",
      },
    });
  });

  it("reflects the column count in the track", () => {
    expect(buildBoard(2).style.gridTemplateColumns).toBe("repeat(2, minmax(272px, 1fr))");
  });
});
