import { useRef, useState } from "react";

/**
 * The state-reducer pattern (as shipped by Downshift): the hook owns a reducer that computes the
 * DEFAULT next state for every action, but before committing it, it hands `(state, action+changes)`
 * to an optional consumer `stateReducer` and commits whatever THAT returns. This inverts control —
 * the consumer can veto a transition (e.g. keep the menu open after a select) or override any field
 * (e.g. clamp the highlighted index) without forking the component.
 *
 * The `action` the consumer receives carries `.changes` — the state the hook WOULD have committed —
 * so the common case is `return action.changes` (accept the default) and overrides are one spread:
 * `return { ...action.changes, isOpen: true }`.
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

const initialState: SelectState = {
  isOpen: false,
  highlightedIndex: -1,
  selectedItem: null,
};

/** Clamp a requested highlight index into `[0, length - 1]` (or `-1` when there is nothing to highlight). */
function clampIndex(index: number, length: number): number {
  if (length === 0 || index < 0) return -1;
  return Math.min(index, length - 1);
}

/** The DEFAULT reducer — what the hook commits when no consumer `stateReducer` intervenes. */
function computeChanges(
  state: SelectState,
  action: SelectAction,
  items: string[],
  closeOnSelect: boolean,
): SelectState {
  switch (action.type) {
    case "open":
      return { ...state, isOpen: true };
    case "close":
      return { ...state, isOpen: false, highlightedIndex: -1 };
    case "toggle":
      return state.isOpen
        ? { ...state, isOpen: false, highlightedIndex: -1 }
        : { ...state, isOpen: true };
    case "highlight":
      return { ...state, highlightedIndex: clampIndex(action.index, items.length) };
    case "moveHighlight": {
      const n = items.length;
      if (n === 0) return state;
      const from =
        state.highlightedIndex < 0 ? (action.delta > 0 ? -1 : 0) : state.highlightedIndex;
      const next = (((from + action.delta) % n) + n) % n;
      return { ...state, highlightedIndex: next };
    }
    case "select":
      return {
        ...state,
        selectedItem: action.item,
        highlightedIndex: action.index,
        isOpen: closeOnSelect ? false : state.isOpen,
      };
  }
}

export function useSelect(config: UseSelectConfig): UseSelectReturn {
  const [state, setState] = useState<SelectState>(initialState);

  // Keep the latest config in a ref so `dispatch` never closes over a stale `stateReducer`/`items`.
  const configRef = useRef(config);
  configRef.current = config;

  const dispatch = (action: SelectAction): void => {
    setState((prev) => {
      const { items, closeOnSelect = true, stateReducer } = configRef.current;
      const changes = computeChanges(prev, action, items, closeOnSelect);
      // Defer to the consumer: it receives the proposed `changes` and returns what to commit.
      return stateReducer ? stateReducer(prev, { ...action, changes }) : changes;
    });
  };

  return {
    ...state,
    open: () => dispatch({ type: "open" }),
    close: () => dispatch({ type: "close" }),
    toggle: () => dispatch({ type: "toggle" }),
    highlight: (index) => dispatch({ type: "highlight", index }),
    moveHighlight: (delta) => dispatch({ type: "moveHighlight", delta }),
    selectItem: (item, index) => dispatch({ type: "select", item, index }),
  };
}
