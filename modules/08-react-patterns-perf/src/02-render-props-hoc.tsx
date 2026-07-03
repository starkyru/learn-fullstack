import type { ComponentType, ReactNode } from "react";

/**
 * YOUR TURN (render prop) — a <Toggle> that owns a boolean `on` and passes it (plus a
 * `toggle` fn) to a `render` function prop: `render({ on, toggle })`. It renders whatever
 * that function returns.
 */
export interface ToggleRenderArgs {
  on: boolean;
  toggle: () => void;
}
export function Toggle(_props: {
  render: (args: ToggleRenderArgs) => ReactNode;
}): ReactNode {
  throw new Error("TODO: hold `on` state, call props.render({ on, toggle })");
}

/**
 * YOUR TURN (HOC) — return a new component that renders `Component` with an extra
 * `disabled={true}` prop merged in. Preserve the component's other props.
 */
export function withDisabled<P extends object>(
  _Component: ComponentType<P & { disabled?: boolean }>,
): ComponentType<P> {
  throw new Error("TODO: return a wrapper that injects disabled={true}");
}
