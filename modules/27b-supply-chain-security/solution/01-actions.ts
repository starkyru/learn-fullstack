export function isPinnedAction(reference: string): boolean {
  return /^[\w.-]+\/[\w.-]+@[a-f0-9]{40}$/i.test(reference);
}
