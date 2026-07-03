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

// ---- Button (worked example) -------------------------------------------------------------

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

// ---- Input (analog you complete in src/) -------------------------------------------------

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function Input({ id, label, className, ...props }: InputProps): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        className={cn("rounded-lg border border-border px-3 py-2 text-sm", className)}
        {...props}
      />
    </div>
  );
}

export const inputStories: Record<string, Story<InputProps>> = {
  Empty: {
    args: { id: "title", label: "Title", placeholder: "Ship it" },
    render: (args) => <Input {...args} />,
  },
  Filled: {
    args: { id: "title", label: "Title", defaultValue: "Draft" },
    render: (args) => <Input {...args} />,
  },
};
