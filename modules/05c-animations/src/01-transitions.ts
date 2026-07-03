/**
 * Compositor-only transition + keyframe builders. A smooth animation only ever touches
 * `transform` (translate/scale) and `opacity` — those run on the compositor without a layout or
 * paint. Everything here emits plain style objects (framework-agnostic) that reference nothing but
 * those two properties, and a guard proves it.
 */

/** The only two properties the compositor can animate cheaply. */
export const COMPOSITOR_PROPS = ["transform", "opacity"] as const;

/** Layout properties that trigger reflow every frame — never animate these. */
export const LAYOUT_PROPS = [
  "top",
  "left",
  "right",
  "bottom",
  "width",
  "height",
  "margin",
  "padding",
] as const;

export interface AnimStyle {
  transform?: string;
  opacity?: number;
  transition?: string;
  willChange?: string;
}

/** Build a CSS `transition` shorthand for the given properties, e.g. "transform 200ms ease-out". */
export function buildTransition(
  properties: readonly string[],
  durationMs: number,
  easing: string,
): string {
  return properties.map((p) => `${p} ${durationMs}ms ${easing}`).join(", ");
}

/**
 * WORKED EXAMPLE — a card hover lift. The "move" is a `translateY` and the "grow" is a `scale`,
 * so nothing reflows. `willChange` hints the compositor to promote the layer up front.
 */
export function hoverStyle(
  opts: { lift?: number; scale?: number; durationMs?: number } = {},
): AnimStyle {
  const lift = opts.lift ?? 4;
  const scale = opts.scale ?? 1.02;
  const durationMs = opts.durationMs ?? 200;
  return {
    transform: `translateY(${-lift}px) scale(${scale})`,
    transition: buildTransition(["transform"], durationMs, "ease-out"),
    willChange: "transform",
  };
}

/**
 * YOUR TURN (analog of `hoverStyle`) — an enter transition (fade + rise). Mirror the worked
 * example's compositor-only discipline:
 *   - `hidden`  → { opacity: 0, transform: `translateY(${rise}px)`, transition, willChange }
 *   - `visible` → { opacity: 1, transform: "translateY(0px)",     transition, willChange }
 * Defaults: `rise = 8`, `durationMs = 240`. Build the `transition` for BOTH "transform" and
 * "opacity" via `buildTransition`, easing "ease-out". Set `willChange` to "transform, opacity".
 * Emit NO layout property (`top`/`width`/…) — `usesOnlyCompositorProps` must stay true.
 */
export function enterStyle(
  _state: "hidden" | "visible",
  _opts: { rise?: number; durationMs?: number } = {},
): AnimStyle {
  throw new Error(
    "TODO: return the hidden/visible enter style (opacity + translateY only)",
  );
}

export interface Keyframe {
  opacity?: number;
  transform?: string;
}

/**
 * ANALOG — the same enter as a keyframe pair (`from` → `to`) for a CSS `@keyframes` artifact.
 * Reuses `enterStyle` so the declarative and imperative forms can never drift apart.
 */
export function enterKeyframes(opts: { rise?: number } = {}): {
  from: Keyframe;
  to: Keyframe;
} {
  const hidden = enterStyle("hidden", opts);
  const visible = enterStyle("visible", opts);
  return {
    from: { opacity: hidden.opacity, transform: hidden.transform },
    to: { opacity: visible.opacity, transform: visible.transform },
  };
}

/**
 * WORKED EXAMPLE — proves a style object is compositor-safe: no key is a layout property and the
 * `transition` shorthand never schedules one. The whole point of this module in one predicate.
 */
export function usesOnlyCompositorProps(style: object): boolean {
  const layout = LAYOUT_PROPS as readonly string[];
  const record = style as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (layout.includes(key)) return false;
  }
  const transition = typeof record["transition"] === "string" ? record["transition"] : "";
  return !layout.some((p) => transition.includes(`${p} `));
}
