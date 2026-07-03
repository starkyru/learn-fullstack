/**
 * Motion helpers as pure data: a timing gate that honors `prefers-reduced-motion`, the `card-drop`
 * keyframe map, a `transition` shorthand builder, and the composed animation style. Reduced motion
 * collapses duration to 0 and drops the keyframe animation.
 */

export interface Timing {
  duration: number;
  easing: string;
}

export function shouldAnimate(prefersReducedMotion: boolean): Timing {
  return prefersReducedMotion
    ? { duration: 0, easing: "linear" }
    : { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" };
}

export function cardDropKeyframes(): Record<"from" | "to", Record<string, string>> {
  return {
    from: { opacity: "0", transform: "translateY(-8px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  };
}

export function transition(properties: string[], timing: Timing): string {
  return properties
    .map((prop) => `${prop} ${timing.duration}ms ${timing.easing}`)
    .join(", ");
}

export function dropAnimation(timing: Timing): Record<string, string> {
  if (timing.duration === 0) return { animation: "none" };
  return { animation: `card-drop ${timing.duration}ms ${timing.easing} both` };
}
