/**
 * Click-to-select and leak-free teardown — the two things a real 3D scene MUST get right.
 *
 * Both are pure and headless: `Raycaster` is ray/triangle math (no GL), and `dispose()` is just a
 * method call on each geometry/material/texture. The GPU only matters for actually drawing; picking
 * and freeing do not, so we can prove them correct in Node.
 *
 * YOUR TURN — implement both:
 *
 * 1. `selectAt(raycaster, camera, meshes, ndc)` — point the ray through the camera at normalized
 *    device coords `ndc` (x/y in [-1, 1], center = 0,0) with `raycaster.setFromCamera(ndc, camera)`,
 *    intersect `meshes`, and return the object of the NEAREST hit (intersections come back sorted by
 *    distance). Return `null` when the ray hits nothing.
 *
 * 2. `disposeObject(root)` — traverse the whole graph and call `.dispose()` on every geometry, every
 *    material, and every texture referenced by those materials. Free each resource EXACTLY once even
 *    when meshes SHARE a material or texture (dedupe by identity) — nothing double-freed, nothing
 *    leaked.
 */
import * as THREE from "three";

export function selectAt(
  _raycaster: THREE.Raycaster,
  _camera: THREE.Camera,
  _meshes: THREE.Object3D[],
  _ndc: THREE.Vector2,
): THREE.Object3D | null {
  throw new Error(
    "TODO: raycaster.setFromCamera(ndc, camera); return the nearest intersectObjects hit's .object, or null",
  );
}

export function disposeObject(_root: THREE.Object3D): void {
  throw new Error(
    "TODO: traverse root and dispose every geometry/material/texture exactly once (dedupe shared refs)",
  );
}
