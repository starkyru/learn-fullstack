import { useEffect, useState } from "react";

export interface BoardNameState {
  loading: boolean;
  error: string | null;
  name: string | null;
}

/**
 * YOUR TURN — fetch `url` (returns `{ name: string }`) inside `useEffect`.
 * Start in `{ loading: true, error: null, name: null }`. On success set
 * `{ loading: false, error: null, name }`; on a non-2xx or thrown error set
 * `{ loading: false, error: <message>, name: null }`. Re-run when `url` changes.
 * IMPORTANT: use a `cancelled` flag in the cleanup so you never setState after unmount.
 * (You'll need `useState` for the state and `useEffect` for the fetch.)
 */
export function useBoardName(_url: string): BoardNameState {
  throw new Error("TODO: fetch in useEffect with loading/error and a cancelled cleanup");
}
