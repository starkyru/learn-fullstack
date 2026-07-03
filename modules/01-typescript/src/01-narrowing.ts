export type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "square"; side: number };

/**
 * WORKED EXAMPLE — narrow on `kind`, compute the area per variant.
 */
export function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "square":
      return shape.side ** 2;
  }
}

/**
 * YOUR TURN (analog) — return a human label for each shape, e.g.
 *   circle → "circle r=2"   rect → "rect 3x4"   square → "square 5"
 * Narrow on `shape.kind` exactly like `area` does. Return a string.
 */
export function label(_shape: Shape): string {
  throw new Error("TODO: implement label by narrowing on shape.kind");
}
