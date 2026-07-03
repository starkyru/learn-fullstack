import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg",
  secondary: "bg-gray-200 text-gray-900",
  ghost: "bg-transparent text-brand",
};

/**
 * The seed component of the sample library. Real variants/tokens land in module 11.
 */
export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
