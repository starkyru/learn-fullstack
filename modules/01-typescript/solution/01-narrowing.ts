export type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "square"; side: number };

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

export function label(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `circle r=${shape.radius}`;
    case "rect":
      return `rect ${shape.width}x${shape.height}`;
    case "square":
      return `square ${shape.side}`;
  }
}
