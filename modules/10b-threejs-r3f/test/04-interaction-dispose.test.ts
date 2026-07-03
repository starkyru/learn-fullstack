import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { disposeObject, selectAt } from "../solution/04-interaction-dispose.js";

function camera(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  cam.position.set(0, 0, 5);
  cam.updateMatrixWorld();
  return cam;
}

function box(z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(0, 0, z);
  mesh.updateMatrixWorld();
  return mesh;
}

describe("selectAt", () => {
  it("returns the nearest mesh under the click, not one behind it", () => {
    const near = box(0);
    const far = box(-3);
    const hit = selectAt(
      new THREE.Raycaster(),
      camera(),
      [far, near],
      new THREE.Vector2(0, 0),
    );
    expect(hit).toBe(near);
  });

  it("returns null when the ray misses every mesh", () => {
    const near = box(0);
    const far = box(-3);
    // Far corner of the frustum — clear of the small box near the center.
    const hit = selectAt(
      new THREE.Raycaster(),
      camera(),
      [far, near],
      new THREE.Vector2(0.95, 0.95),
    );
    expect(hit).toBeNull();
  });

  it("returns null for an empty mesh list", () => {
    const hit = selectAt(new THREE.Raycaster(), camera(), [], new THREE.Vector2(0, 0));
    expect(hit).toBeNull();
  });

  it("does NOT pick meshes nested inside a Group (non-recursive selection)", () => {
    // A child mesh dead-centre under the click, but reachable only by recursing
    // into its parent Group. selectAt uses intersectObjects(..., false), so the
    // Group (which owns no geometry) is a miss and its child is never tested.
    const child = box(0);
    const group = new THREE.Group();
    group.add(child);
    group.updateMatrixWorld(true);

    const hit = selectAt(
      new THREE.Raycaster(),
      camera(),
      [group],
      new THREE.Vector2(0, 0),
    );
    expect(hit).toBeNull();
  });
});

describe("disposeObject", () => {
  it("disposes every geometry, material and texture exactly once — shared refs included", () => {
    const geoA = new THREE.BoxGeometry(1, 1, 1);
    const geoB = new THREE.BoxGeometry(2, 2, 2);
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture }); // shared by both meshes

    const meshA = new THREE.Mesh(geoA, material);
    const meshB = new THREE.Mesh(geoB, material);
    const light = new THREE.DirectionalLight(); // no geometry/material — must be skipped safely

    const root = new THREE.Group();
    root.add(meshA, meshB, light);

    const spies = {
      geoA: vi.spyOn(geoA, "dispose"),
      geoB: vi.spyOn(geoB, "dispose"),
      texture: vi.spyOn(texture, "dispose"),
      material: vi.spyOn(material, "dispose"),
    };

    disposeObject(root);

    expect(spies.geoA).toHaveBeenCalledTimes(1);
    expect(spies.geoB).toHaveBeenCalledTimes(1);
    // Shared exactly once despite two meshes referencing them (no double free).
    expect(spies.material).toHaveBeenCalledTimes(1);
    expect(spies.texture).toHaveBeenCalledTimes(1);
  });

  it("disposes a geometry shared by two meshes exactly once", () => {
    // One BoxGeometry referenced by both meshes: the `seen` guard must collapse
    // the two visits into a single dispose (no double free of shared GPU memory).
    const shared = new THREE.BoxGeometry(1, 1, 1);
    const meshA = new THREE.Mesh(shared, new THREE.MeshBasicMaterial());
    const meshB = new THREE.Mesh(shared, new THREE.MeshBasicMaterial());

    const root = new THREE.Group();
    root.add(meshA, meshB);

    const spy = vi.spyOn(shared, "dispose");

    disposeObject(root);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("disposes an array-material's every entry once", () => {
    const matA = new THREE.MeshBasicMaterial();
    const matB = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [matA, matB]);

    const spyA = vi.spyOn(matA, "dispose");
    const spyB = vi.spyOn(matB, "dispose");

    disposeObject(mesh);

    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
  });
});
