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
 * The "slow" async data source. In a real app this awaits a DB/network round-trip;
 * here the delay is injected so tests can control the fallback → content transition
 * deterministically (no timers, no `Date.now`).
 */
export async function loadActivityFeed(
  items: Activity[],
  delay: () => Promise<void> = () => Promise.resolve(),
): Promise<Activity[]> {
  await delay();
  return items;
}

/** Reads the feed promise with `use()`; suspends the nearest boundary until it resolves. */
export function ActivityFeed({ promise }: { promise: Promise<Activity[]> }) {
  const items = use(promise);
  return (
    <ul aria-label="activity">
      {items.map((a) => (
        <li key={a.id}>{a.text}</li>
      ))}
    </ul>
  );
}

/**
 * Renders the board shell synchronously and streams the feed behind a Suspense
 * boundary: the heading is visible on first paint while `<ActivityFeed>` shows the
 * fallback, then the feed content replaces the fallback once the promise resolves.
 */
export function BoardWithFeed({ feed }: { feed: Promise<Activity[]> }) {
  return (
    <section>
      <h1>Sprint Board</h1>
      <Suspense fallback={<p>Loading activity…</p>}>
        <ActivityFeed promise={feed} />
      </Suspense>
    </section>
  );
}
