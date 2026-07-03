import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

export const cardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  tags: z.array(z.object({ value: z.string().min(1, "Tag can't be empty") })),
});
export type CardValues = z.infer<typeof cardSchema>;

/**
 * YOUR TURN — build a "new card" form with React Hook Form + a zod resolver and a
 * dynamic tag list. Hint-only:
 *
 * 1. `useForm<CardValues>({ resolver: zodResolver(cardSchema), defaultValues:
 *    { title: "", tags: [{ value: "" }] } })` — destructure `register`, `control`,
 *    `handleSubmit`, and `formState.errors`.
 * 2. `useFieldArray({ control, name: "tags" })` → `{ fields, append, remove }`.
 * 3. Register the title (`{...register("title")}`) and each tag
 *    (`{...register(\`tags.${i}.value\`)}`); link every input to a `<label htmlFor>`.
 * 4. Render `errors.title?.message` and `errors.tags?.[i]?.value?.message` in a
 *    `<p role="alert">`. Add an "Add tag" button (`append({ value: "" })`) and a
 *    per-row "Remove tag N" button (`remove(i)`).
 * 5. Submit with `onSubmit={handleSubmit(onSubmit)}` — RHF calls your handler only
 *    when the resolver passes.
 */
export function NewCardForm(_props: { onSubmit: (values: CardValues) => void }) {
  throw new Error("TODO: NewCardForm with RHF + zodResolver + useFieldArray");
}
