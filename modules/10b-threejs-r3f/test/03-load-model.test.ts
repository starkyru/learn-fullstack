import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
  loadModel,
  type LoadedModel,
  type ModelLoader,
} from "../solution/03-load-model.js";

/** A loader whose promise we resolve/reject by hand — the true async boundary, mocked. */
function deferredLoader(): {
  loader: ModelLoader;
  resolve: (value: LoadedModel) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: LoadedModel) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<LoadedModel>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { loader: { loadAsync: vi.fn(() => promise) }, resolve, reject };
}

describe("loadModel resource", () => {
  it("suspends by throwing the pending promise while loading", () => {
    const { loader } = deferredLoader();
    const resource = loadModel("cube.glb", loader);
    expect(loader.loadAsync).toHaveBeenCalledWith("cube.glb");

    let thrown: unknown;
    try {
      resource.read();
    } catch (e) {
      thrown = e;
    }
    expect(typeof (thrown as PromiseLike<unknown>)?.then).toBe("function");
  });

  it("returns exactly the parsed gltf.scene once resolved", async () => {
    const { loader, resolve } = deferredLoader();
    const resource = loadModel("cube.glb", loader);

    const scene = new THREE.Group();
    let pending: unknown;
    try {
      resource.read();
    } catch (e) {
      pending = e;
    }
    resolve({ scene });
    await pending; // the in-flight promise settles the resource's internal status

    expect(resource.read()).toBe(scene);
  });

  it("re-throws the loader error once rejected", async () => {
    const { loader, reject } = deferredLoader();
    const resource = loadModel("broken.glb", loader);

    const boom = new Error("404 model not found");
    let pending: unknown;
    try {
      resource.read();
    } catch (e) {
      pending = e;
    }
    reject(boom);
    await pending;

    expect(() => resource.read()).toThrow(boom);
  });
});
