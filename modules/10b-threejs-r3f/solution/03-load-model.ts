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

type Status =
  | { state: "pending"; promise: Promise<void> }
  | { state: "success"; model: Object3D }
  | { state: "error"; error: unknown };

export function loadModel(url: string, loader: ModelLoader): ModelResource {
  let status: Status;

  const promise = loader.loadAsync(url).then(
    (loaded) => {
      status = { state: "success", model: loaded.scene };
    },
    (error: unknown) => {
      status = { state: "error", error };
    },
  );

  status = { state: "pending", promise };

  return {
    read(): Object3D {
      if (status.state === "pending") throw status.promise;
      if (status.state === "error") throw status.error;
      return status.model;
    },
  };
}
