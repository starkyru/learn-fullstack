import type { ReactElement } from "react";

/**
 * YOUR TURN (EXT) — build a `Toolbar` that CONSUMES the library `Button`.
 *   - `import { Button } from "./01-primitives.js";`
 *   - render a `role="toolbar"` with an aria-label, containing:
 *       a primary Button "Add card" wired to `onAdd`, and a ghost Button "Clear" wired to `onClear`.
 * This is the exact shape both apps wire in (kanban under Tailwind, chat under CSS Modules).
 */

export interface ToolbarProps {
  onAdd: () => void;
  onClear: () => void;
}

export function Toolbar(_props: ToolbarProps): ReactElement {
  throw new Error("TODO: a Toolbar that consumes the library Button");
}
