import { useForm } from "@tanstack/react-form";
import type { ReactElement } from "react";

/**
 * Task 5 — a taste of TanStack Router + TanStack Form (reference solution).
 *
 * ROUTER TASTE — the idea TanStack Router sells is TYPE-SAFE params. We model just that with a tiny
 * `defineRoute`: a route owns a `path` template and a `parseParams` that turns the raw string map
 * from the URL into a typed object. `buildPath` is the inverse. The generic `Params` flows through
 * both, so `cardRoute.buildPath({ boardId, cardId })` is a compile error if you pass the wrong
 * shape — the survey's whole point, without pulling in the router runtime. (Module 23b builds a
 * router from scratch; this is only the typed-descriptor flavor.)
 *
 * FORM TASTE — one `@tanstack/react-form` field with per-field validators keyed by cause
 * (`onChange`/`onSubmit`). Errors are a plain `string[]` on `field.state.meta.errors`.
 */

export interface RouteDescriptor<Params> {
  path: string;
  parseParams: (raw: Record<string, string>) => Params;
  buildPath: (params: Params) => string;
}

export function defineRoute<Params extends Record<string, string | number>>(config: {
  path: string;
  parseParams: (raw: Record<string, string>) => Params;
}): RouteDescriptor<Params> {
  return {
    path: config.path,
    parseParams: config.parseParams,
    buildPath: (params) =>
      config.path.replace(/\$(\w+)/g, (_match, key: string) =>
        String(params[key as keyof Params]),
      ),
  };
}

export type CardParams = {
  boardId: string;
  cardId: number;
};

/** A typed route: `cardId` is a NUMBER after parsing, not the raw string from the URL. */
export const cardRoute: RouteDescriptor<CardParams> = defineRoute<CardParams>({
  path: "/boards/$boardId/cards/$cardId",
  parseParams: (raw) => {
    const boardId = raw["boardId"];
    const cardIdRaw = raw["cardId"];
    if (boardId === undefined || cardIdRaw === undefined) {
      throw new Error("missing route params");
    }
    return { boardId, cardId: Number(cardIdRaw) };
  },
});

const validateHandle = ({ value }: { value: string }): string | undefined => {
  if (value.trim() === "") return "Handle is required";
  if (!value.startsWith("@")) return "Handle must start with @";
  return undefined;
};

/** A one-field survey form: the `handle` must be non-empty and start with `@`. */
export function SurveyForm({
  onSubmit,
}: {
  onSubmit: (values: { handle: string }) => void;
}): ReactElement {
  const form = useForm({
    defaultValues: { handle: "" },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      aria-label="Survey"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="handle"
        validators={{ onChange: validateHandle, onSubmit: validateHandle }}
      >
        {(field) => (
          <>
            <label htmlFor="handle">Handle</label>
            <input
              id="handle"
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
      <button type="submit">Submit</button>
    </form>
  );
}
