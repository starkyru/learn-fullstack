import { z } from "zod";

/**
 * `withAuth` — the security envelope every mutating Server Action should wear. It wraps
 * a core action so that, before any work runs, two gates pass:
 *
 * 1. AUTHORIZATION — there must be an authenticated session (Auth.js gives you
 *    `auth()` → `{ user }`), and, if a `role` is required, the user must hold it.
 *    Otherwise return `{ ok: false, error: "unauthorized" }` and never call the action.
 * 2. VALIDATION — the untrusted input is parsed with the zod `schema`; a bad payload
 *    returns `{ ok: false, error }` and, again, never reaches the action.
 *
 * Only when both gates pass does the core `action` run, with the caller's `userId`
 * threaded through as trusted context. The session is injected as a `deps` boundary so
 * the whole authorize/validate/passthrough flow is unit-testable without Auth.js.
 *
 * EXTEND task: this file mirrors the solution so you can read the finished shape, then
 * extend it — e.g. add an ownership check (row.userId === ctx.userId) or a rate limit,
 * and prove your new gate rejects with a test.
 */

export type Session = { user: { id: string; role: string } } | null;

export type SecureResult<O> = { ok: true; data: O } | { ok: false; error: string };

export function withAuth<I, O>(config: {
  schema: z.ZodType<I>;
  role?: string;
  action: (input: I, ctx: { userId: string }) => Promise<O>;
}) {
  return async (input: unknown, deps: { session: Session }): Promise<SecureResult<O>> => {
    const { session } = deps;
    if (!session?.user) {
      return { ok: false, error: "unauthorized" };
    }
    if (config.role && session.user.role !== config.role) {
      return { ok: false, error: "unauthorized" };
    }
    const parsed = config.schema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid input" };
    }
    const data = await config.action(parsed.data, { userId: session.user.id });
    return { ok: true, data };
  };
}
