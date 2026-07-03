import type { ReactElement } from "react";
import { Button } from "./01-primitives.js";

/**
 * The consume shape: a feature component (this `Toolbar`) imports library primitives and wires
 * them to app callbacks. Both apps do exactly this — `apps/kanban-web` renders it under a
 * Tailwind theme, `apps/chat-web` under CSS Modules — but the import and the props are identical.
 * That's the payoff of a shared library: one `Button`, many consumers.
 */

export interface ToolbarProps {
  onAdd: () => void;
  onClear: () => void;
}

export function Toolbar({ onAdd, onClear }: ToolbarProps): ReactElement {
  return (
    <div role="toolbar" aria-label="Board actions" className="flex gap-2">
      <Button variant="primary" onClick={onAdd}>
        Add card
      </Button>
      <Button variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
