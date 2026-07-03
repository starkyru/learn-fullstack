/** Angular speed of the r3f spin, in radians per second. */
export const R3F_SPIN_SPEED = 1;

/** The subset of an Object3D the frame callback touches — a plain `{ rotation }` bag. */
export interface Spinnable {
  rotation: { x: number; y: number };
}

export function spinOnFrame(
  target: Spinnable,
  delta: number,
  speed: number = R3F_SPIN_SPEED,
): void {
  target.rotation.x += delta * speed;
  target.rotation.y += delta * speed;
}
