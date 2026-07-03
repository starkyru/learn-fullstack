import { useState } from "react";

/**
 * YOUR TURN (extend/refactor) — this list re-renders EVERY row when any one row toggles,
 * because `Row` isn't memoized and its `onToggle` prop is a new function each render.
 * Fix it: wrap `Row` in `React.memo` and give each row a STABLE `onToggle` (e.g. pass the id
 * and a stable handler, or `useCallback`). The test asserts toggling row 0 renders only row 0.
 */
export function Row({
  id,
  done,
  onToggle,
  onRender,
}: {
  id: string;
  done: boolean;
  onToggle: (id: string) => void;
  onRender: (id: string) => void;
}) {
  onRender(id);
  return (
    <button type="button" aria-label={`toggle ${id}`} onClick={() => onToggle(id)}>
      {id}: {done ? "done" : "todo"}
    </button>
  );
}

export function List({ onRowRender }: { onRowRender: (id: string) => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({
    a: false,
    b: false,
    c: false,
  });
  const onToggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  return (
    <div>
      {Object.keys(done).map((id) => (
        <Row
          key={id}
          id={id}
          done={done[id]!}
          onToggle={onToggle}
          onRender={onRowRender}
        />
      ))}
    </div>
  );
}
