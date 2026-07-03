/**
 * The state-reducer pattern (as shipped by Downshift): the hook owns a reducer that computes the
 * DEFAULT next state for every action, but before committing it, it hands `(state, action+changes)`
 * to an optional consumer `stateReducer` and commits whatever THAT returns. This inverts control —
 * the consumer can veto a transition or override any field without forking the component.
 *
 * YOUR TURN — implement `useSelect` from scratch:
 *   1. Hold `SelectState` (isOpen / highlightedIndex / selectedItem) with `useState`.
 *   2. Write the DEFAULT reducer: open/close/toggle drive `isOpen`; `highlight` clamps the index;
 *      `moveHighlight` wraps within `items.length`; `select` records the item and (when
 *      `closeOnSelect`, default true) closes.
 *   3. On each action compute the default `changes`, then if a `stateReducer` was passed, commit
 *      `stateReducer(state, { ...action, changes })` instead of the default — else commit `changes`.
 *   4. Return the flattened state plus the action creators (open/close/toggle/highlight/
 *      moveHighlight/selectItem).
 * Keep the latest config in a ref so dispatch never closes over a stale `stateReducer`/`items`.
 */

export interface SelectState {
  isOpen: boolean;
  highlightedIndex: number;
  selectedItem: string | null;
}

export type SelectAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "toggle" }
  | { type: "highlight"; index: number }
  | { type: "moveHighlight"; delta: number }
  | { type: "select"; item: string; index: number };

/** The action as the consumer's `stateReducer` sees it: the original action plus the proposed next state. */
export type SelectActionWithChanges = SelectAction & { changes: SelectState };

export type SelectStateReducer = (
  state: SelectState,
  action: SelectActionWithChanges,
) => SelectState;

export interface UseSelectConfig {
  items: string[];
  /** Auto-close the menu when an item is selected. Defaults to `true`. */
  closeOnSelect?: boolean;
  /** Intercept every transition: return the state to commit (usually `action.changes`). */
  stateReducer?: SelectStateReducer;
}

export interface UseSelectReturn extends SelectState {
  open: () => void;
  close: () => void;
  toggle: () => void;
  highlight: (index: number) => void;
  moveHighlight: (delta: number) => void;
  selectItem: (item: string, index: number) => void;
}

export function useSelect(_config: UseSelectConfig): UseSelectReturn {
  throw new Error(
    "TODO: build the select state machine that defers each transition to an optional stateReducer",
  );
}
