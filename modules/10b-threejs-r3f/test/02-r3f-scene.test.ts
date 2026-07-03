import { describe, expect, it } from "vitest";
import { R3F_SPIN_SPEED, spinOnFrame, type Spinnable } from "../solution/02-r3f-scene.js";

describe("spinOnFrame (the useFrame callback logic)", () => {
  it("advances both axes by delta * default speed, mutating in place", () => {
    const target: Spinnable = { rotation: { x: 0, y: 0 } };
    spinOnFrame(target, 0.5);
    expect(target.rotation.x).toBe(0.5 * R3F_SPIN_SPEED);
    expect(target.rotation.y).toBe(0.5 * R3F_SPIN_SPEED);
  });

  it("accumulates across frames of varying delta", () => {
    const target: Spinnable = { rotation: { x: 0, y: 0 } };
    spinOnFrame(target, 0.1);
    spinOnFrame(target, 0.2);
    spinOnFrame(target, 0.05);
    const expected = (0.1 + 0.2 + 0.05) * R3F_SPIN_SPEED;
    expect(target.rotation.x).toBeCloseTo(expected, 10);
    expect(target.rotation.y).toBeCloseTo(expected, 10);
  });

  it("honors an explicit speed", () => {
    const target: Spinnable = { rotation: { x: 1, y: 2 } };
    spinOnFrame(target, 0.5, 4);
    expect(target.rotation.x).toBe(1 + 0.5 * 4);
    expect(target.rotation.y).toBe(2 + 0.5 * 4);
  });

  it("is a no-op movement when delta is 0", () => {
    const target: Spinnable = { rotation: { x: 3, y: 7 } };
    spinOnFrame(target, 0);
    expect(target.rotation.x).toBe(3);
    expect(target.rotation.y).toBe(7);
  });
});
