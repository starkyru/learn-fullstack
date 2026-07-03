import { Transform } from "node:stream";

/**
 * YOUR TURN (🔴 from scratch) — return a `Transform` stream that uppercases every chunk of
 * text flowing through it. Implement `transform(chunk, _enc, callback)`: convert the chunk
 * (a Buffer) to a string, uppercase it, and `callback(null, upper)`. No helper libraries.
 */
export function uppercaseTransform(): Transform {
  throw new Error("TODO: return a Transform that uppercases each chunk");
}
