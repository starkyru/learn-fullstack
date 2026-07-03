/**
 * Declarative react-three-fiber version of the spinning cube. The <Canvas>, <mesh>, useFrame and
 * <OrbitControls> live in the shipped ARTIFACT `artifacts/SpinningCube.tsx` — they need a real GL
 * context, so jsdom cannot render them. What IS unit-testable is the pure math the `useFrame`
 * callback runs every frame, extracted here so it can be exercised with no browser.
 *
 * YOUR TURN — implement `spinOnFrame`:
 *   - `useFrame((_, delta) => spinOnFrame(ref.current, delta))` calls this once per frame with the
 *     seconds elapsed since the previous frame (`delta`).
 *   - Advance BOTH `target.rotation.x` and `target.rotation.y` by `delta * speed` (default
 *     `R3F_SPIN_SPEED`). Mutate in place — that is how r3f drives the underlying Object3D — and keep
 *     it framerate-independent (scale by `delta`, never a fixed per-frame constant).
 */

/** Angular speed of the r3f spin, in radians per second. */
export const R3F_SPIN_SPEED = 1;

/** The subset of an Object3D the frame callback touches — a plain `{ rotation }` bag. */
export interface Spinnable {
  rotation: { x: number; y: number };
}

export function spinOnFrame(
  _target: Spinnable,
  _delta: number,
  _speed: number = R3F_SPIN_SPEED,
): void {
  throw new Error(
    "TODO: target.rotation.x += delta * speed; target.rotation.y += delta * speed",
  );
}
