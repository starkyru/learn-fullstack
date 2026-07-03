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

/** Pure reducer modelling the AnimatePresence exit lifecycle + layout reorder. */
export function reduce(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    case "remove": {
      const present = state.items.some((i) => i.id === action.id);
      // Ignore an unknown id or a double-remove — the key is already exiting.
      if (!present || state.exiting.includes(action.id)) return state;
      return {
        items: state.items.filter((i) => i.id !== action.id),
        exiting: [...state.exiting, action.id],
      };
    }
    case "exited": {
      if (!state.exiting.includes(action.id)) return state;
      return {
        items: state.items,
        exiting: state.exiting.filter((id) => id !== action.id),
      };
    }
    case "reorder": {
      const next = state.items.slice();
      const moved = next[action.from];
      if (moved === undefined || action.to < 0 || action.to >= next.length) return state;
      next.splice(action.from, 1);
      next.splice(action.to, 0, moved);
      return { items: next, exiting: state.exiting };
    }
    default:
      return state;
  }
}

/** The keys React should keep mounted: live items first, then anything still exiting. */
export function visibleKeys(state: ListState): string[] {
  return [...state.items.map((i) => i.id), ...state.exiting];
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
