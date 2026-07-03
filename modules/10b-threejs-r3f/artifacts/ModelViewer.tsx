/**
 * ARTIFACT (Task 3) — a glTF model loaded with drei's `useGLTF` behind a <Suspense> fallback.
 *
 * NOT in tsconfig `include` and NOT run by the gate: `useGLTF` fetches over the network and the
 * result is drawn with WebGL. It ships as the reference for a real app. The Suspense-resource brain
 * — throw-to-suspend / throw-to-error / return-the-scene — is unit-tested in `../src/03-load-model.ts`
 * (`loadModel`), which is exactly the shape drei's cache implements.
 *
 * Requires `@react-three/drei` (useGLTF) in the app that renders it.
 */
import { useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url); // suspends until the model resolves
  return <primitive object={scene} />;
}

export function ModelViewer({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <directionalLight position={[3, 3, 3]} />
      <ambientLight intensity={0.3} />
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
    </Canvas>
  );
}
