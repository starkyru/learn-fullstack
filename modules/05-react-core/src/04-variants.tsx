import type { BadgeProps, CardProps } from "./01-components.js";

export interface Variant<P> {
  name: string;
  args: P;
}

/**
 * WORKED EXAMPLE — the variant list a Storybook story will consume in module 11.
 */
export function cardVariants(): Variant<CardProps>[] {
  return [
    { name: "title only", args: { title: "Card" } },
    { name: "with description", args: { title: "Card", description: "Details" } },
  ];
}

/**
 * YOUR TURN (analog) — return one variant per Badge tone: "neutral", "success", "danger".
 * Each `args` must be valid BadgeProps (a `label` plus the `tone`).
 */
export function badgeVariants(): Variant<BadgeProps>[] {
  throw new Error("TODO: one Variant per Badge tone");
}
