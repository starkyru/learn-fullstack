import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactElement } from "react";

/** Join truthy class tokens (the library's tiny `cn`). */
export function cn(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(" ");
}

/**
 * A story is DATA, not a test: `args` are the knobs, `render` turns them into UI. The same
 * object feeds Storybook, unit tests, and play functions — one source of truth per state.
 */
export interface Story<P> {
  args: P;
  render: (args: P) => ReactElement;
}

// ---- Button (worked example — study this in solution/01-primitives.tsx) -------------------

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg",
  secondary: "bg-surface text-fg",
  ghost: "bg-transparent text-brand",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        BUTTON_VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}

export const buttonStories: Record<string, Story<ButtonProps>> = {
  Primary: {
    args: { variant: "primary", children: "Save" },
    render: (args) => <Button {...args} />,
  },
  Secondary: {
    args: { variant: "secondary", children: "Cancel" },
    render: (args) => <Button {...args} />,
  },
  Ghost: {
    args: { variant: "ghost", children: "Skip" },
    render: (args) => <Button {...args} />,
  },
};

// ---- Input (YOUR TURN) -------------------------------------------------------------------
//
// Build <Input> to mirror <Button>: a labelled text field. Requirements:
//   1. Props: `{ id, label }` plus the native input attributes.
//   2. Render a <label htmlFor={id}> next to an <input id={id}> so the label is wired to the
//      field (click-to-focus + screen-reader name). Merge `className` via `cn`.
//   3. Export `inputStories` with at least an `Empty` and a `Filled` story (see buttonStories).

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function Input(_props: InputProps): ReactElement {
  throw new Error("TODO: build the labelled <Input> primitive");
}

export const inputStories: Record<string, Story<InputProps>> = {};
