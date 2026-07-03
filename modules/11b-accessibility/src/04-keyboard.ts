/**
 * YOUR TURN — compute the next focused index for a roving-tabindex widget.
 *  - "ArrowDown"/"ArrowRight": next, wrapping to 0 after the last.
 *  - "ArrowUp"/"ArrowLeft": previous, wrapping to count-1 before the first.
 *  - "Home": 0.  "End": count-1.  Any other key: return `current` unchanged.
 * Assume 0 <= current < count and count > 0.
 */
export function nextRovingIndex(_current: number, _key: string, _count: number): number {
  throw new Error("TODO: map the key to the next index with wrap-around");
}
