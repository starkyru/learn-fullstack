type Endpoint = { url: string; timeout: number };

/**
 * WORKED EXAMPLE — `satisfies` checks the value against a type WITHOUT widening it. The keys
 * stay literal ("auth" | "billing"), so `endpoint()` only accepts a real service name and
 * `SERVICES.auth.url` is known to exist. Compare `const X: Record<string, Endpoint> = …`,
 * which would widen the keys to `string` and lose that safety.
 */
export const SERVICES = {
  auth: { url: "/auth", timeout: 5000 },
  billing: { url: "/billing", timeout: 10000 },
} satisfies Record<string, Endpoint>;

export function endpoint(name: keyof typeof SERVICES): string {
  return SERVICES[name].url;
}

/**
 * YOUR TURN (analog) — add `satisfies Record<string, string>` to `THEME` so its keys stay
 * literal ("primary" | "danger"), then return the hex for a given name.
 * Steps: 1) append `satisfies Record<string, string>` to the object literal
 *        2) return `THEME[name]`.
 */
export const THEME = {
  primary: "#2563eb",
  danger: "#dc2626",
}; // TODO: add `satisfies Record<string, string>` so `name` is checked

export function colorOf(_name: keyof typeof THEME): string {
  throw new Error(
    "TODO: return THEME[name] — add `satisfies` above so the name is checked",
  );
}
