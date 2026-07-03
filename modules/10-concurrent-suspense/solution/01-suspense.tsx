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
 * ANALOG (learner builds this in src/) — same shape, reading a user's name.
 */
export function UserName({ promise }: { promise: Promise<string> }) {
  const name = use(promise);
  return <span>{name}</span>;
}
