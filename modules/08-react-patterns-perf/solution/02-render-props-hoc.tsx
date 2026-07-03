import { useState, type ComponentType, type ReactNode } from "react";

export interface ToggleRenderArgs {
  on: boolean;
  toggle: () => void;
}
export function Toggle({
  render,
}: {
  render: (args: ToggleRenderArgs) => ReactNode;
}): ReactNode {
  const [on, setOn] = useState(false);
  return render({ on, toggle: () => setOn((v) => !v) });
}

export function withDisabled<P extends object>(
  Component: ComponentType<P & { disabled?: boolean }>,
): ComponentType<P> {
  return function WithDisabled(props: P) {
    return <Component {...props} disabled={true} />;
  };
}
