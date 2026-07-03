import { Suspense, use } from "react";

/**
 * Streaming with Suspense — the App-Router pattern where the static board "shell"
 * (heading, columns) is sent immediately and a slow section (the activity feed) is
 * streamed in when its data resolves. A `<Suspense>` boundary renders its fallback
 * while the feed promise is pending, then swaps in the content. React 19's `use()`
 * reads the promise and suspends until it settles.
 */

export interface Activity {
  id: string;
  text: string;
}

/**
 * YOUR TURN — build the "slow" async data source. Await the injected `delay()` (so
 * tests can hold it pending, then resolve), then return `items`. Keep the injected
 * delay so the demo has no real timers and stays deterministic.
 */
export async function loadActivityFeed(
  _items: Activity[],
  _delay: () => Promise<void> = () => Promise.resolve(),
): Promise<Activity[]> {
  throw new Error("TODO: await delay() then return items");
}

/**
 * YOUR TURN — read the feed `promise` with `use(promise)` (it suspends until the
 * promise resolves) and render the activities as `<li>` items inside a
 * `<ul aria-label="activity">`, keyed by `a.id`.
 */
export function ActivityFeed(_props: { promise: Promise<Activity[]> }) {
  void use;
  throw new Error("TODO: read the promise with use() and render the activity list");
}

/**
 * YOUR TURN — render the board shell synchronously (an `<h1>Sprint Board</h1>`) and
 * stream the feed behind a Suspense boundary: wrap `<ActivityFeed promise={feed} />`
 * in `<Suspense fallback={<p>Loading activity…</p>}>` so the heading paints
 * immediately while the fallback shows, then the feed replaces it on resolve.
 */
export function BoardWithFeed(_props: { feed: Promise<Activity[]> }) {
  void Suspense;
  throw new Error("TODO: render the shell + a Suspense-wrapped ActivityFeed");
}
