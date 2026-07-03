/**
 * A layout "composer" is a pure function of options → an exact `{ className, style }` pair: the
 * className a JSX `className=` receives and the inline-style object a `style=` receives. The browser
 * paints it; the DECISION of which classes/values to emit is plain data you can assert on.
 */

export interface LayoutResult {
  className: string;
  style: Record<string, string>;
}

export interface BoardColumnOptions {
  gap?: number;
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

export interface CardGridOptions {
  columns?: number;
  gap?: number;
}

export function cardGrid({ columns = 3, gap = 16 }: CardGridOptions = {}): LayoutResult {
  return {
    className: `card-grid card-grid--cols-${columns}`,
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: `${gap}px`,
    },
  };
}
