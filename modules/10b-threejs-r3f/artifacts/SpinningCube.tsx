/**
 * ARTIFACT (Task 2) — the react-three-fiber spinning cube with OrbitControls.
 *
 * This file is NOT in tsconfig `include` and is NOT run by the gate: <Canvas>, useFrame and
 * <OrbitControls> all need a real WebGL context, which jsdom does not provide. It ships as the
 * reference you drop into a real app. The unit-tested brain of `useFrame` — `spinOnFrame` in
 * `02-r3f-scene.ts` — is imported here (from `solution/`) so the two stay in lockstep.
 *
 * Requires `@react-three/drei` (OrbitControls) in the app that renders it.
 */
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import { spinOnFrame } from "../solution/02-r3f-scene.js";

function Cube() {
  const ref = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (ref.current) spinOnFrame(ref.current, delta);
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6699ff" />
    </mesh>
  );
}

export function SpinningCube() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <directionalLight position={[3, 3, 3]} />
      <ambientLight intensity={0.3} />
      <Cube />
      <OrbitControls />
    </Canvas>
  );
}
