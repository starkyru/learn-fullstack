"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A form wired to a Server Action with `useActionState`. In the real app you'd pass
 * the bound `"use server"` action; here `action` is injected so the whole progressive-
 * enhancement flow (pending → error/success) is unit-testable with a fake at the
 * boundary.
 *
 * `useActionState(action, initial)` returns `[state, formAction, isPending]`:
 * - wire `formAction` to `<form action=...>` — React submits the FormData to `action`
 *   and stores its return as the next `state` (works even before JS hydrates, which is
 *   the "progressive enhancement" win);
 * - `isPending` is true while the action is in-flight — drive the busy UI from it;
 * - `state` carries the last result, so `state.error` / `state.card` render the outcome.
 */

export type FormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; title: string };

const INITIAL: FormState = { status: "idle" };

export type CardFormAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

/** `useFormStatus` must render under the form whose submission it observes. */
export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : "Create card"}
    </button>
  );
}

export function CardForm({ action }: { action: CardFormAction }) {
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction}>
      <label htmlFor="card-title">Title</label>
      <input id="card-title" name="title" />
      <SubmitButton />
      {state.status === "error" && <p role="alert">{state.error}</p>}
      {state.status === "success" && <p role="status">Created {state.title}</p>}
    </form>
  );
}
