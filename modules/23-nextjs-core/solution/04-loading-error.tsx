"use client";

import { Suspense, use } from "react";
import type { ReactElement } from "react";

/**
 * `loading.tsx` — Next renders this while a segment's data is suspending. It's a
 * plain component returning a status fallback (role="status" so assistive tech
 * announces it).
 */
export function Loading(): ReactElement {
  return <p role="status">Loading…</p>;
}

/**
 * `error.tsx` — Next's error convention file is always a Client Component and
 * receives `{ error, reset }`. It shows the message and a `reset` button that
 * re-attempts rendering the segment.
 */
export function ErrorState({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactElement {
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

/** Reads a suspending promise with React 19's `use()` — the leaf that suspends. */
export function CardPanel({ promise }: { promise: Promise<string> }): ReactElement {
  const title = use(promise);
  return <p aria-label="card-panel">{title}</p>;
}

/**
 * The Suspense boundary demo: wraps the suspending `<CardPanel>` in a
 * `<Suspense fallback={<Loading/>}>`, so the fallback shows while the promise is
 * pending and the resolved content replaces it once it settles — the same
 * boundary Next builds from `loading.tsx`.
 */
export function SuspendingBoard({ promise }: { promise: Promise<string> }): ReactElement {
  return (
    <Suspense fallback={<Loading />}>
      <CardPanel promise={promise} />
    </Suspense>
  );
}
