import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const cardTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
});
export type CardTitleValues = z.infer<typeof cardTitleSchema>;

/** Thrown by the API boundary to carry per-field server-side validation errors. */
export class ServerValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) {
    super("Server validation failed");
    this.name = "ServerValidationError";
  }
}

/**
 * YOUR TURN (extend) — client validation isn't enough; the server owns invariants
 * the client can't know (e.g. "title already taken"). Extend an RHF form so a
 * rejected submit surfaces server errors on the right fields. Hint-only:
 *
 * 1. `useForm<CardTitleValues>({ resolver: zodResolver(cardTitleSchema),
 *    defaultValues: { title: "" } })` — grab `register`, `handleSubmit`, `setError`,
 *    and `formState.{errors, isSubmitting}`.
 * 2. In an async submit handler: `await createCard(values)` then `onSuccess()`.
 * 3. `catch (err)`: if `err instanceof ServerValidationError`, loop
 *    `Object.entries(err.fieldErrors)` and `setError(field, { type: "server",
 *    message })` — but only for keys that exist in `cardTitleSchema.shape`. Track
 *    whether anything matched; if not (empty or unknown keys), fall back to
 *    `setError("root", …)` so the failure never vanishes silently. Any other error
 *    → the same `root` fallback.
 * 4. Render `errors.title?.message` and `errors.root?.message` in `<p role="alert">`,
 *    and disable the submit button while `isSubmitting`.
 */
export function CardFormWithServer(_props: {
  createCard: (values: CardTitleValues) => Promise<void>;
  onSuccess: () => void;
}) {
  // Reference imports so they aren't flagged unused while the body is a stub.
  void useForm;
  void zodResolver;
  throw new Error("TODO: map ServerValidationError onto RHF fields via setError");
}
