import { useForm } from "@tanstack/react-form";

export interface TanCardValues {
  title: string;
  tag: string;
}

const required =
  (message: string) =>
  ({ value }: { value: string }) =>
    value.trim() ? undefined : message;

/**
 * The same "new card" form rebuilt with TanStack Form. Tradeoffs vs RHF:
 * - state is fully controlled per field (`field.state.value` + `field.handleChange`),
 *   where RHF leans on uncontrolled `register`;
 * - validators are colocated per field and keyed by cause (`onChange`/`onSubmit`)
 *   instead of one form-level resolver;
 * - errors are a plain `string[]` on `field.state.meta.errors`.
 */
export function TanStackCardForm({
  onSubmit,
}: {
  onSubmit: (values: TanCardValues) => void;
}) {
  const form = useForm({
    defaultValues: { title: "", tag: "" } as TanCardValues,
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      aria-label="New card (TanStack)"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="title"
        validators={{
          onChange: required("Title is required"),
          onSubmit: required("Title is required"),
        }}
      >
        {(field) => (
          <>
            <label htmlFor="tan-title">Title</label>
            <input
              id="tan-title"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <p role="alert">{field.state.meta.errors[0]}</p>
            )}
          </>
        )}
      </form.Field>

      <form.Field
        name="tag"
        validators={{
          onChange: required("Tag can't be empty"),
          onSubmit: required("Tag can't be empty"),
        }}
      >
        {(field) => (
          <>
            <label htmlFor="tan-tag">Tag</label>
            <input
              id="tan-tag"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <p role="alert">{field.state.meta.errors[0]}</p>
            )}
          </>
        )}
      </form.Field>

      <button type="submit">Create card</button>
    </form>
  );
}
