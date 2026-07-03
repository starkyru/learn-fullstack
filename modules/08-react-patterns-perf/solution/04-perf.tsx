import { memo, useCallback, useState } from "react";

export const Row = memo(function Row({
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
});

export function List({ onRowRender }: { onRowRender: (id: string) => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({
    a: false,
    b: false,
    c: false,
  });
  // Stable identity → memoized rows whose `done` didn't change won't re-render.
  const onToggle = useCallback(
    (id: string) => setDone((d) => ({ ...d, [id]: !d[id] })),
    [],
  );
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
