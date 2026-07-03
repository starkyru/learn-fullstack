import { Component, use, type ReactNode } from "react";

/**
 * A class error boundary — the ONLY way to catch render/Suspense errors, since
 * hooks can't. `getDerivedStateFromError` swaps in the fallback on the next render.
 */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

/**
 * WORKED EXAMPLE — read a promise with React 19's `use()`. While the promise is
 * pending, `use()` suspends (the nearest <Suspense> shows its fallback); on resolve
 * React re-renders with the value; on reject it throws to the nearest boundary.
 * The SAME promise instance must be passed across renders.
 */
export function CardTitle({ promise }: { promise: Promise<string> }) {
  const title = use(promise);
  return <span>{title}</span>;
}

/**
 * YOUR TURN (analog) — build <UserName> the same way as <CardTitle>: take a
 * `promise: Promise<string>`, read it with `use(promise)`, and render the resolved
 * name in a `<span>`. The caller wraps it in `<Suspense fallback>` (and, for the
 * reject path, an `<ErrorBoundary fallback>`).
 */
export function UserName(_props: { promise: Promise<string> }) {
  throw new Error("TODO: read the promise with use() and render the name");
}
