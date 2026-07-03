export type User = { id: string; name: string; email: string };

export function applyPatch<T extends object>(base: T, patch: Partial<T>): T {
  return { ...base, ...patch };
}

export function indexById<T extends { id: string }>(
  items: readonly T[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const item of items) out[item.id] = item;
  return out;
}
