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
 * Client validation is necessary but not sufficient — the server owns invariants
 * the client can't know (uniqueness, auth). This form maps a rejected
 * `ServerValidationError` back onto the offending field via RHF's `setError`, and
 * falls back to a form-level `root` error for anything else.
 */
export function CardFormWithServer({
  createCard,
  onSuccess,
}: {
  createCard: (values: CardTitleValues) => Promise<void>;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CardTitleValues>({
    resolver: zodResolver(cardTitleSchema),
    defaultValues: { title: "" },
  });

  async function submit(values: CardTitleValues) {
    try {
      await createCard(values);
      onSuccess();
    } catch (err) {
      if (err instanceof ServerValidationError) {
        let matched = false;
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          if (field in cardTitleSchema.shape) {
            setError(field as keyof CardTitleValues, { type: "server", message });
            matched = true;
          }
        }
        // Empty or unmapped field errors must not vanish silently — fall back to a
        // form-level message so the user always sees the submit failed.
        if (!matched) {
          setError("root", { type: "server", message: "Something went wrong" });
        }
      } else {
        setError("root", { type: "server", message: "Something went wrong" });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate aria-label="Create card">
      <label htmlFor="server-title">Title</label>
      <input id="server-title" {...register("title")} />
      {errors.title && <p role="alert">{errors.title.message}</p>}
      {errors.root && <p role="alert">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting}>
        Create card
      </button>
    </form>
  );
}
