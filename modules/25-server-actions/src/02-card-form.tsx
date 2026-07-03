"use client";

import { useActionState } from "react";

/**
 * YOUR TURN — build a <CardForm> that posts to a Server Action via `useActionState`,
 * showing a pending state while the action runs and the error/success outcome after.
 * The `action` is injected (a real app passes a bound `"use server"` fn); tests pass a
 * fake. Hint-only:
 *
 * 1. `const [state, formAction, isPending] = useActionState(action, INITIAL)`.
 * 2. Render `<form action={formAction}>` with a `<label htmlFor="card-title">` bound to
 *    `<input id="card-title" name="title" />` and a submit `<button>`.
 * 3. While `isPending`, disable the button and show "Saving…" (else "Create card").
 * 4. When `state.status === "error"`, render `state.error` in a `<p role="alert">`.
 * 5. When `state.status === "success"`, render `Created {state.title}` in a
 *    `<p role="status">`.
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

export function CardForm(_props: { action: CardFormAction }) {
  void useActionState;
  void INITIAL;
  throw new Error("TODO: wire useActionState → pending + error/success UI");
}
