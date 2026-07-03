import { useForm } from "@tanstack/react-form";
import type { ReactElement } from "react";

/**
 * Task 5 — a taste of TanStack Router + TanStack Form (TODO).
 *
 * Build a typed route descriptor and a one-field survey form.
 */

export interface RouteDescriptor<Params> {
  path: string;
  parseParams: (raw: Record<string, string>) => Params;
  buildPath: (params: Params) => string;
}

/**
 * YOUR TURN — return a descriptor:
 *   - keep `path` and `parseParams` from `config`.
 *   - add `buildPath(params)` that fills each `$name` segment in the path with `params[name]`
 *     (e.g. `/boards/$boardId` + `{ boardId: "b1" }` → `/boards/b1`).
 */
export function defineRoute<Params extends Record<string, string | number>>(_config: {
  path: string;
  parseParams: (raw: Record<string, string>) => Params;
}): RouteDescriptor<Params> {
  throw new Error(
    "TODO: return { path, parseParams, buildPath } with $-segment substitution",
  );
}

export type CardParams = {
  boardId: string;
  cardId: number;
};

/**
 * YOUR TURN — a typed route where `cardId` is a NUMBER after parsing:
 *   - path `/boards/$boardId/cards/$cardId`.
 *   - `parseParams(raw)` returns `{ boardId: raw.boardId, cardId: Number(raw.cardId) }`
 *     (throw if either is missing so the params type stays honest).
 */
export const cardRoute: RouteDescriptor<CardParams> = defineRoute<CardParams>({
  path: "/boards/$boardId/cards/$cardId",
  parseParams: (): CardParams => {
    throw new Error("TODO: parse boardId (string) + cardId (number) from the raw params");
  },
});

/**
 * YOUR TURN — a one-field survey form:
 *   - `useForm({ defaultValues: { handle: "" }, onSubmit })`.
 *   - one `form.Field name="handle"` with `onChange`/`onSubmit` validators that return
 *     "Handle is required" when empty and "Handle must start with @" when it does not start with @.
 *   - render an `<input>` bound to `field.state.value`/`field.handleChange`, a `role="alert"` for
 *     the first error, and a submit button.
 */
export function SurveyForm(_props: {
  onSubmit: (values: { handle: string }) => void;
}): ReactElement {
  // Keep the import meaningful while stubbed.
  void useForm;
  throw new Error("TODO: build the one-field survey form with per-field validators");
}
