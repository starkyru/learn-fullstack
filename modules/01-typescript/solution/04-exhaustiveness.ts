import type { Shape } from "./01-narrowing.js";

export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}

export function corners(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return 0;
    case "rect":
      return 4;
    case "square":
      return 4;
    default:
      return assertNever(shape);
  }
}
