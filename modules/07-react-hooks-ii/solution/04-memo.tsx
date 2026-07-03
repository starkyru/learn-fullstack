import { memo, useCallback, useState } from "react";

export const Child = memo(function Child({
  onPing,
  onRender,
}: {
  onPing: () => void;
  onRender: () => void;
}) {
  onRender();
  return (
    <button type="button" onClick={onPing}>
      ping
    </button>
  );
});

export function Parent({ onChildRender }: { onChildRender: () => void }) {
  const [count, setCount] = useState(0);
  const [pings, setPings] = useState(0);
  const onPing = useCallback(() => setPings((p) => p + 1), []); // stable identity
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="pings">{pings}</span>
      <button type="button" aria-label="bump" onClick={() => setCount((c) => c + 1)}>
        bump
      </button>
      <Child onPing={onPing} onRender={onChildRender} />
    </div>
  );
}
