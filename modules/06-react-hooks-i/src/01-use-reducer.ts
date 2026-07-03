import { useReducer } from "react";

/**
 * WORKED EXAMPLE — a boolean toggle built on useReducer.
 */
export function useToggle(initial = false): [boolean, () => void] {
  const [on, toggle] = useReducer((s: boolean) => !s, initial);
  return [on, toggle];
}

/**
 * YOUR TURN (analog) — a counter via useReducer. Return
 *   { count, inc, dec, reset }
 * where inc/dec change by 1 and reset returns to `initial`. Model actions as a union and
 * write the reducer; don't use useState.
 */
export function useCounter(_initial = 0): {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
} {
  throw new Error("TODO: implement useCounter with a useReducer");
}
