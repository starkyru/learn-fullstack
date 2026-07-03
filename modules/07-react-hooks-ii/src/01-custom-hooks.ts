import { useEffect, useState } from "react";

/**
 * WORKED EXAMPLE — persist state to localStorage, hydrating from it on first render.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

/**
 * YOUR TURN (analog) — return a debounced copy of `value` that only updates `delayMs` after
 * the latest change. Hint: keep the debounced value in `useState`; in a `useEffect` keyed on
 * [value, delayMs] set a `setTimeout` to update it, and clear the timer in the cleanup.
 */
export function useDebounce<T>(_value: T, _delayMs: number): T {
  throw new Error("TODO: debounce value with useState + useEffect + setTimeout cleanup");
}
