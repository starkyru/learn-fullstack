/**
 * A Framer Motion list with `layout` reorder + `AnimatePresence` exit-on-delete.
 *
 * The COMPONENT below is an ARTIFACT — it needs a real browser (layout + rAF) to actually animate,
 * so the gate doesn't render it. What IS unit-testable is the exit/reorder lifecycle as a pure
 * reducer: a removed key can't just vanish (its exit animation must play first), so it moves to an
 * `exiting` set and stays in `visibleKeys` until an `exited` event unmounts it. That reducer is the
 * pure model of what `AnimatePresence` does internally.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useReducer } from "react";

export interface Item {
  id: string;
  label: string;
}

export interface ListState {
  /** Logical order — the source of truth (a removed item is gone from here immediately). */
  items: readonly Item[];
  /** Keys mid-exit: removed from `items` but still rendered until their exit animation finishes. */
  exiting: readonly string[];
}

export type ListAction =
  | { type: "remove"; id: string }
  | { type: "exited"; id: string }
  | { type: "reorder"; from: number; to: number };

/**
 * YOUR TURN — implement the reducer modelling the exit lifecycle + reorder:
 *   - "remove"  → drop the item from `items` and push its id into `exiting` (it's still visible for
 *                 the exit animation). Ignore an unknown id or an already-exiting one (return state).
 *   - "exited"  → the exit animation finished: remove the id from `exiting`. Ignore unknown ids.
 *   - "reorder" → move `items[from]` to index `to` (immutably). Out-of-range → return state.
 * Always return a NEW state object on a change; return the SAME `state` on a no-op.
 */
export function reduce(_state: ListState, _action: ListAction): ListState {
  throw new Error("TODO: model remove → exiting → exited, plus immutable reorder");
}

/**
 * YOUR TURN — the keys React should keep mounted: live item ids first, then anything still exiting
 * (so a just-removed key is STILL present here until its "exited" event fires).
 */
export function visibleKeys(_state: ListState): string[] {
  throw new Error("TODO: return [...live item ids, ...exiting keys]");
}

/**
 * ARTIFACT — the shipped Framer Motion list. `layout` on each `motion.li` animates the reorder;
 * `AnimatePresence` keeps a removed `<li>` mounted while its `exit` transform/opacity plays. Only
 * `transform` + `opacity` are animated, so it stays on the compositor.
 */
export function AnimatedList({ initial }: { initial: readonly Item[] }) {
  const [state, dispatch] = useReducer(reduce, { items: initial, exiting: [] });
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      <AnimatePresence>
        {state.items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {item.label}
            <button
              type="button"
              onClick={() => dispatch({ type: "remove", id: item.id })}
            >
              Remove {item.label}
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
