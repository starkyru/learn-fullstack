import { useForm } from "@tanstack/react-form";

export interface TanCardValues {
  title: string;
  tag: string;
}

/**
 * YOUR TURN — rebuild the card form with TanStack Form, then note the tradeoffs vs
 * React Hook Form (task 2) in the README. Hint-only:
 *
 * 1. `const form = useForm({ defaultValues: { title: "", tag: "" }, onSubmit: async
 *    ({ value }) => onSubmit(value) })`.
 * 2. Render a `<form>` whose `onSubmit` does `e.preventDefault()` then
 *    `form.handleSubmit()`.
 * 3. For each field use `<form.Field name="title" validators={{ onChange: fn,
 *    onSubmit: fn }}>` where `fn = ({ value }) => value.trim() ? undefined : "…"`.
 *    The child is a render function `(field) => (...)`.
 * 4. Inside, wire a controlled `<input value={field.state.value}
 *    onChange={e => field.handleChange(e.target.value)} onBlur={field.handleBlur}>`
 *    linked to a `<label htmlFor>`, and render `field.state.meta.errors[0]` in a
 *    `<p role="alert">` when `errors.length > 0`.
 * 5. `onSubmit` should fire only when both fields validate — TanStack runs the
 *    `onSubmit` validators before calling your handler.
 */
export function TanStackCardForm(_props: { onSubmit: (values: TanCardValues) => void }) {
  // Reference `useForm` so the import is used while the body is a stub.
  void useForm;
  throw new Error("TODO: rebuild the card form with @tanstack/react-form");
}
