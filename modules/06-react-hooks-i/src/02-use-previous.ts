/**
 * YOUR TURN — return the value from the PREVIOUS render (undefined on the first render).
 * Use a `useRef` box: read it for the return value, then update it in a `useEffect` so the
 * next render sees the current value as "previous". Do not cause re-renders.
 */
export function usePrevious<T>(_value: T): T | undefined {
  throw new Error("TODO: track the previous value with useRef + useEffect");
}
