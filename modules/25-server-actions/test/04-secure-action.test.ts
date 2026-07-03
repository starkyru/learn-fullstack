import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { withAuth, type Session } from "../solution/04-secure-action.js";

const schema = z.object({ title: z.string().min(1, "Title is required") });

function build() {
  const core = vi.fn(async (input: { title: string }, ctx: { userId: string }) => ({
    saved: input.title,
    by: ctx.userId,
  }));
  const action = withAuth({ schema, role: "editor", action: core });
  return { core, action };
}

const editor: Session = { user: { id: "u1", role: "editor" } };

describe("withAuth", () => {
  it("passes a valid session + input through to the action with the userId context", async () => {
    const { core, action } = build();

    const res = await action({ title: "Ship it" }, { session: editor });

    expect(core).toHaveBeenCalledWith({ title: "Ship it" }, { userId: "u1" });
    expect(res).toEqual({ ok: true, data: { saved: "Ship it", by: "u1" } });
  });

  it("rejects a missing session as unauthorized without calling the action", async () => {
    const { core, action } = build();

    const res = await action({ title: "Ship it" }, { session: null });

    expect(res).toEqual({ ok: false, error: "unauthorized" });
    expect(core).not.toHaveBeenCalled();
  });

  it("rejects a session lacking the required role as unauthorized", async () => {
    const { core, action } = build();

    const res = await action(
      { title: "Ship it" },
      { session: { user: { id: "u2", role: "viewer" } } },
    );

    expect(res).toEqual({ ok: false, error: "unauthorized" });
    expect(core).not.toHaveBeenCalled();
  });

  it("checks auth BEFORE validation: no session + invalid input is 'unauthorized', not a zod error", async () => {
    const { core, action } = build();

    // Input is zod-invalid AND there is no session. Auth must win — leaking a validation
    // error here would reveal schema details to an unauthenticated caller.
    const res = await action({ title: "" }, { session: null });

    expect(res).toEqual({ ok: false, error: "unauthorized" });
    expect(core).not.toHaveBeenCalled();
  });

  it("rejects a zod-invalid input even for an authorized session, without calling the action", async () => {
    const { core, action } = build();

    const res = await action({ title: "" }, { session: editor });

    expect(res).toEqual({ ok: false, error: "Title is required" });
    expect(core).not.toHaveBeenCalled();
  });
});
