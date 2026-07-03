import * as THREE from "three";

export function selectAt(
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  meshes: THREE.Object3D[],
  ndc: THREE.Vector2,
): THREE.Object3D | null {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(meshes, false);
  return hits[0]?.object ?? null;
}

/** Anything holding a GPU resource exposes a `dispose()` — geometries, materials and textures all do. */
interface Disposable {
  dispose?: () => void;
}

/** The mesh-shaped slice of an Object3D that carries GPU resources. */
interface ResourceHolder {
  geometry?: Disposable;
  material?: Disposable | Disposable[];
}

function disposeOnce(resource: Disposable | undefined, seen: Set<unknown>): void {
  if (!resource || seen.has(resource)) return;
  seen.add(resource);
  resource.dispose?.();
}

export function disposeObject(root: THREE.Object3D): void {
  const seen = new Set<unknown>();

  root.traverse((object) => {
    const holder = object as unknown as ResourceHolder;

    disposeOnce(holder.geometry, seen);

    if (!holder.material) return;
    const materials = Array.isArray(holder.material)
      ? holder.material
      : [holder.material];
    for (const material of materials) {
      // A material's texture-valued fields (map, normalMap, ...) each own GPU memory too.
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) disposeOnce(value, seen);
      }
      disposeOnce(material, seen);
    }
  });
}
