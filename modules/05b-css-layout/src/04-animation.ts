/**
 * Animations & motion, minus the browser. jsdom can't run keyframes, so we test the DECISIONS: the
 * timing to use (and the `prefers-reduced-motion` gate that collapses it to instant), the keyframe
 * map, the `transition` shorthand builder, and the composed animation style. Reduced motion must
 * cut duration to 0 and drop the keyframe animation entirely.
 *
 * YOUR TURN — implement all four (delete the throws):
 *
 *   shouldAnimate(prefersReducedMotion): the timing gate.
 *     - prefersReducedMotion → { duration: 0, easing: "linear" }
 *     - otherwise            → { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }
 *
 *   cardDropKeyframes(): the `card-drop` keyframes as a { from, to } map:
 *     from: { opacity: "0", transform: "translateY(-8px)" }
 *     to:   { opacity: "1", transform: "translateY(0)" }
 *
 *   transition(properties, timing): join `"<prop> <duration>ms <easing>"` with ", ".
 *
 *   dropAnimation(timing): if timing.duration === 0 return { animation: "none" }
 *     (reduced motion → no animation); otherwise
 *     { animation: `card-drop ${timing.duration}ms ${timing.easing} both` }.
 */

export interface Timing {
  duration: number;
  easing: string;
}

export function shouldAnimate(_prefersReducedMotion: boolean): Timing {
  throw new Error(
    "TODO: reduced motion → { duration: 0, easing: 'linear' }; else 200ms cubic-bezier",
  );
}

export function cardDropKeyframes(): Record<"from" | "to", Record<string, string>> {
  throw new Error(
    "TODO: return { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } }",
  );
}

export function transition(_properties: string[], _timing: Timing): string {
  throw new Error("TODO: join `${prop} ${duration}ms ${easing}` with ', '");
}

export function dropAnimation(_timing: Timing): Record<string, string> {
  throw new Error(
    "TODO: duration 0 → { animation: 'none' }; else { animation: `card-drop ${duration}ms ${easing} both` }",
  );
}
