/**
 * Load a glTF model and expose it behind a Suspense-style RESOURCE. The <Suspense fallback> +
 * `useGLTF(url)` component lives in the shipped ARTIFACT `artifacts/ModelViewer.tsx`; drei's
 * `useGLTF` is itself just a cache around this exact pattern. Here we own the pattern so it can be
 * tested with the loader boundary mocked — no network, no GL.
 *
 * The Suspense contract for a resource's `read()`:
 *   - still loading  → THROW the pending promise (React suspends on it and shows the fallback).
 *   - failed         → THROW the error (an error boundary catches it).
 *   - loaded         → RETURN the parsed model (`gltf.scene`).
 *
 * YOUR TURN — implement `loadModel`:
 *   - kick off `loader.loadAsync(url)`; when it settles, record success (store `loaded.scene`) or
 *     error. Start in the `pending` state holding the in-flight promise.
 *   - return `{ read() }` that follows the contract above.
 */
import type { Object3D } from "three";

/** A parsed glTF — we only care about its `scene` graph. */
export interface LoadedModel {
  scene: Object3D;
}

/** The injected loader boundary (drei's `useGLTF` / three's `GLTFLoader` both fit this shape). */
export interface ModelLoader {
  loadAsync(url: string): Promise<LoadedModel>;
}

/** A Suspense resource: call `read()` in render; it throws-to-suspend until the model is ready. */
export interface ModelResource {
  read(): Object3D;
}

export function loadModel(_url: string, _loader: ModelLoader): ModelResource {
  throw new Error(
    "TODO: start loader.loadAsync(url); return { read() } that throws the pending promise, throws the error, or returns the resolved scene",
  );
}
