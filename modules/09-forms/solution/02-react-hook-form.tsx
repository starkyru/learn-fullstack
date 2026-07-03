import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

export const cardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  tags: z.array(z.object({ value: z.string().min(1, "Tag can't be empty") })),
});
export type CardValues = z.infer<typeof cardSchema>;

/**
 * A "new card" form built with React Hook Form + a zod resolver and a dynamic
 * field array of tags. RHF keeps inputs uncontrolled (via `register`) and only
 * re-renders on validation/array changes — the production default.
 */
export function NewCardForm({ onSubmit }: { onSubmit: (values: CardValues) => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { title: "", tags: [{ value: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "tags" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="New card">
      <label htmlFor="card-title">Title</label>
      <input id="card-title" {...register("title")} />
      {errors.title && <p role="alert">{errors.title.message}</p>}

      {fields.map((field, i) => (
        <div key={field.id}>
          <label htmlFor={`card-tag-${i}`}>Tag {i + 1}</label>
          <input id={`card-tag-${i}`} {...register(`tags.${i}.value`)} />
          {errors.tags?.[i]?.value && (
            <p role="alert">{errors.tags[i]?.value?.message}</p>
          )}
          <button type="button" onClick={() => remove(i)}>
            Remove tag {i + 1}
          </button>
        </div>
      ))}

      <button type="button" onClick={() => append({ value: "" })}>
        Add tag
      </button>
      <button type="submit">Create card</button>
    </form>
  );
}
