/**
 * A View Transitions helper that degrades gracefully. `document.startViewTransition(cb)` runs the
 * DOM mutation in `cb` and cross-fades the old/new snapshots — but it isn't everywhere, and it must
 * collapse to an INSTANT update when the user prefers reduced motion. Both the capability and the
 * reduced-motion flag are INJECTED, so both branches are unit-testable without a browser.
 *
 * EXTEND — this baseline WORKS (mirrors `solution/`). Ideas to take it further: return the
 * transition's `finished` promise so callers can await it; add a `skipTransition()` escape hatch;
 * or resolve `reducedMotion` from a live `matchMedia("(prefers-reduced-motion: reduce)")`.
 */

/** The subset of the ViewTransition object we care about. */
export interface ViewTransition {
  finished: Promise<void>;
}

export interface ViewTransitionDeps {
  /** Injected `document.startViewTransition`; omit to simulate an unsupported browser. */
  startViewTransition?: (callback: () => void) => ViewTransition;
  /** Injected reduced-motion decision (default false). */
  reducedMotion?: boolean;
}

export interface ViewTransitionResult {
  /** True only when the update ran inside `startViewTransition`. */
  animated: boolean;
}

/** Read a `prefers-reduced-motion` MediaQueryList-like object; missing = not reduced. */
export function prefersReducedMotion(
  mql: { matches: boolean } | null | undefined,
): boolean {
  return mql?.matches ?? false;
}

/**
 * Run `update` inside a view transition when it's supported AND motion is allowed; otherwise apply
 * it INSTANTLY. On the animated path `startViewTransition` is called exactly once and it owns the
 * DOM mutation. On the instant path `update` runs directly and `startViewTransition` is never called.
 */
export function withViewTransition(
  update: () => void,
  deps: ViewTransitionDeps = {},
): ViewTransitionResult {
  const { startViewTransition, reducedMotion = false } = deps;
  if (startViewTransition && !reducedMotion) {
    startViewTransition(update);
    return { animated: true };
  }
  update();
  return { animated: false };
}
