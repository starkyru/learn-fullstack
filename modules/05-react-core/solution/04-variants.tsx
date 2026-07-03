import type { BadgeProps, CardProps } from "./01-components.js";

export interface Variant<P> {
  name: string;
  args: P;
}

export function cardVariants(): Variant<CardProps>[] {
  return [
    { name: "title only", args: { title: "Card" } },
    { name: "with description", args: { title: "Card", description: "Details" } },
  ];
}

export function badgeVariants(): Variant<BadgeProps>[] {
  return [
    { name: "neutral", args: { label: "Neutral", tone: "neutral" } },
    { name: "success", args: { label: "Success", tone: "success" } },
    { name: "danger", args: { label: "Danger", tone: "danger" } },
  ];
}
