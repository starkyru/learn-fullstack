/**
 * YOUR TURN — return a promise that resolves to the tags in the exact order they run:
 *   ["sync", "microtask", "macrotask"]
 * Push "sync" immediately, "microtask" from a microtask (queueMicrotask / a resolved
 * promise), and "macrotask" from a `setTimeout(…, 0)`. Resolve only after the macrotask has
 * pushed. Do NOT hardcode the array — let the scheduling produce the order.
 */
export function orderedEffects(): Promise<string[]> {
  throw new Error("TODO: schedule sync/microtask/macrotask and collect their order");
}
