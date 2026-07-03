/**
 * WORKED EXAMPLE — `boardColumn`: a Flexbox layout composer.
 *
 * A layout "composer" is a pure function of options → an exact `{ className, style }` pair. No CSS
 * engine, no DOM: just the className string a JSX `className=` would receive and the inline-style
 * object a `style=` would receive. That is the unit-testable core of hand-styling — the browser
 * paints it, but the DECISION of which classes/values to emit is plain data you can assert on.
 *
 * A Trello-style board column is a vertical Flexbox: cards stack top-to-bottom with a gap, and a
 * collapsed column shrinks to a narrow rail.
 */

export interface LayoutResult {
  className: string;
  style: Record<string, string>;
}

export interface BoardColumnOptions {
  /** px gap between stacked cards. */
  gap?: number;
  /** collapsed column → narrow rail + modifier class. */
  collapsed?: boolean;
}

export function boardColumn({
  gap = 8,
  collapsed = false,
}: BoardColumnOptions = {}): LayoutResult {
  return {
    className: collapsed ? "board-column board-column--collapsed" : "board-column",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      width: collapsed ? "48px" : "272px",
    },
  };
}

/**
 * YOUR TURN (analog) — `cardGrid`: mirror `boardColumn`, but with CSS Grid instead of Flexbox.
 *
 * Return `{ className, style }` where:
 *   - className is `card-grid card-grid--cols-<columns>` (columns defaults to 3),
 *   - style is a Grid: `display: "grid"`, `gridTemplateColumns: "repeat(<columns>, minmax(0, 1fr))"`,
 *     and `gap: "<gap>px"` (gap defaults to 16).
 */
export interface CardGridOptions {
  columns?: number;
  gap?: number;
}

export function cardGrid(_options: CardGridOptions = {}): LayoutResult {
  throw new Error(
    'TODO: return { className: `card-grid card-grid--cols-${columns}`, style: { display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: `${gap}px` } }',
  );
}
