import type { MouseEvent } from "react";

/**
 * A HEADLESS hook + PROP GETTERS. `useDisclosure` owns only the open/closed state and the ARIA
 * wiring; it renders nothing, so the SAME hook can drive a dropdown, an accordion row, a modal —
 * any two UIs. The consumer spreads `getButtonProps()` onto a trigger element and `getPanelProps()`
 * onto the region it controls.
 *
 * YOUR TURN — implement `useDisclosure`:
 *   1. Hold `isOpen` with `useState` (seed from `config.defaultOpen`); expose open/close/toggle.
 *   2. Link button ⇄ panel with an id: `config.id ?? useId()`.
 *   3. `getButtonProps(props?)` returns `{ ...props, onClick, "aria-expanded": isOpen,
 *      "aria-controls": panelId }` where `onClick` COMPOSES the caller's onClick (call theirs first,
 *      then toggle) — both must fire; caller-supplied extra props pass through.
 *   4. `getPanelProps(props?)` returns `{ ...props, id: panelId, hidden: !isOpen }`.
 * Recreate the getters each render (do not memoize) so they always read the latest `isOpen`.
 */

export interface UseDisclosureConfig {
  defaultOpen?: boolean;
  /** Force the panel id (otherwise a stable auto-generated id links button ⇄ panel). */
  id?: string;
}

/** What the hook contributes to the trigger element. */
export interface ButtonProps {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  "aria-expanded": boolean;
  "aria-controls": string;
}

/** What the hook contributes to the controlled region. */
export interface PanelProps {
  id: string;
  hidden: boolean;
}

/** Caller-supplied button props the getter will merge (any extra keys pass through untouched). */
export interface ButtonGetterProps {
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  [key: string]: unknown;
}

/** Caller-supplied panel props the getter will merge. */
export interface PanelGetterProps {
  id?: string;
  hidden?: boolean;
  [key: string]: unknown;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  getButtonProps: <P extends ButtonGetterProps>(props?: P) => P & ButtonProps;
  getPanelProps: <P extends PanelGetterProps>(props?: P) => P & PanelProps;
}

export function useDisclosure(_config: UseDisclosureConfig = {}): UseDisclosureReturn {
  throw new Error(
    "TODO: build isOpen state + getButtonProps/getPanelProps prop getters that merge caller props",
  );
}
