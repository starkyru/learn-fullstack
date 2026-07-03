import { useCallback, useId, useState } from "react";
import type { MouseEvent } from "react";

/**
 * A HEADLESS hook + PROP GETTERS. `useDisclosure` owns only the open/closed state and the ARIA
 * wiring; it renders nothing, so the SAME hook can drive a dropdown, an accordion row, a modal —
 * any two UIs. The consumer spreads `getButtonProps()` onto whatever trigger element they like and
 * `getPanelProps()` onto the region it controls.
 *
 * Prop getters exist so the hook can attach behaviour (an `onClick` that toggles, the `aria-*`
 * bookkeeping) WITHOUT clobbering the caller's own props. The getter MERGES: caller props spread
 * first, then the hook's props override the reserved keys, and a caller `onClick` is COMPOSED —
 * both the caller's handler and the internal toggle run.
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

/** Run the caller's handler first; then, unless it was prevented, run ours. */
function composeHandlers(
  callerHandler: ((event: MouseEvent<HTMLElement>) => void) | undefined,
  internalHandler: () => void,
): (event: MouseEvent<HTMLElement>) => void {
  return (event) => {
    callerHandler?.(event);
    if (!event.defaultPrevented) internalHandler();
  };
}

export function useDisclosure(config: UseDisclosureConfig = {}): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState<boolean>(config.defaultOpen ?? false);
  const autoId = useId();
  const panelId = config.id ?? autoId;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // NOT memoized on purpose: recreated each render so they always read the latest `isOpen`.
  const getButtonProps = <P extends ButtonGetterProps>(props?: P): P & ButtonProps => {
    return {
      ...(props as P),
      onClick: composeHandlers(props?.onClick, toggle),
      "aria-expanded": isOpen,
      "aria-controls": panelId,
    };
  };

  const getPanelProps = <P extends PanelGetterProps>(props?: P): P & PanelProps => {
    return {
      ...(props as P),
      id: panelId,
      hidden: !isOpen,
    };
  };

  return { isOpen, open, close, toggle, getButtonProps, getPanelProps };
}
