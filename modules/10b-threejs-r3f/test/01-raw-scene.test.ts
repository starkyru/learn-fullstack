import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import {
  buildCubeScene,
  runFrames,
  SPIN_SPEED,
  stepAnimation,
  type Renderer,
} from "../solution/01-raw-scene.js";

describe("buildCubeScene", () => {
  it("wires exactly a mesh + a light into the scene", () => {
    const { scene } = buildCubeScene();
    expect(scene.children).toHaveLength(2);
    expect(scene.children.some((c) => c instanceof THREE.Mesh)).toBe(true);
    expect(scene.children.some((c) => c instanceof THREE.Light)).toBe(true);
  });

  it("the mesh is a BoxGeometry + MeshStandardMaterial, and the camera is perspective at z=5", () => {
    const { mesh, camera } = buildCubeScene();
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(camera.position.z).toBe(5);
  });

  it("pins the configured light, camera, geometry and material values", () => {
    const { mesh, camera, light } = buildCubeScene();

    // Directional light sits at (3, 3, 3).
    expect(light.position.x).toBe(3);
    expect(light.position.y).toBe(3);
    expect(light.position.z).toBe(3);

    // Perspective camera: fov 75, near 0.1, far 100.
    expect(camera.fov).toBe(75);
    expect(camera.near).toBe(0.1);
    expect(camera.far).toBe(100);

    // Unit box: 1 x 1 x 1.
    const geometry = mesh.geometry as THREE.BoxGeometry;
    expect(geometry.parameters.width).toBe(1);
    expect(geometry.parameters.height).toBe(1);
    expect(geometry.parameters.depth).toBe(1);

    // Material colour 0x6699ff.
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.color.getHex()).toBe(0x6699ff);
  });
});

describe("stepAnimation", () => {
  it("pins SPIN_SPEED to 1 rad/s (the default angular speed)", () => {
    expect(SPIN_SPEED).toBe(1);
  });

  it("advances rotation.y by dt at the default speed", () => {
    const { mesh } = buildCubeScene();
    expect(mesh.rotation.y).toBe(0);
    // Default speed is SPIN_SPEED = 1, so rotation.y accumulates dt directly.
    stepAnimation(mesh, 0.5);
    expect(mesh.rotation.y).toBe(0.5);
    stepAnimation(mesh, 0.25);
    expect(mesh.rotation.y).toBe(0.75);
  });

  it("scales the per-step increment by the injected speed factor", () => {
    const { mesh } = buildCubeScene();
    // Hand-written: 0.5 s * 2 rad/s = 1 rad. Exercises the speed multiplier
    // that a speed of 1 would otherwise hide.
    stepAnimation(mesh, 0.5, 2);
    expect(mesh.rotation.y).toBe(1);
    // Then 0.5 s * 3 rad/s = 1.5 rad more -> 2.5 rad total.
    stepAnimation(mesh, 0.5, 3);
    expect(mesh.rotation.y).toBe(2.5);
  });

  it("leaves the other axes untouched", () => {
    const { mesh } = buildCubeScene();
    stepAnimation(mesh, 1);
    expect(mesh.rotation.x).toBe(0);
    expect(mesh.rotation.z).toBe(0);
  });
});

describe("runFrames", () => {
  it("renders once per frame via the injected renderer and accumulates rotation", () => {
    const { scene, camera, mesh } = buildCubeScene();
    const renderer: Renderer = { render: vi.fn() };

    runFrames({ renderer, scene, camera, mesh }, 0.5, 3);

    expect(renderer.render).toHaveBeenCalledTimes(3);
    expect(renderer.render).toHaveBeenCalledWith(scene, camera);
    // Hand-written: 3 frames * 0.5 s * default speed 1 = 1.5 rad.
    expect(mesh.rotation.y).toBe(1.5);
  });

  it("does nothing (no render, no rotation) when frames is 0", () => {
    const { scene, camera, mesh } = buildCubeScene();
    const renderer: Renderer = { render: vi.fn() };

    runFrames({ renderer, scene, camera, mesh }, 0.5, 0);

    expect(renderer.render).not.toHaveBeenCalled();
    expect(mesh.rotation.y).toBe(0);
  });
});
