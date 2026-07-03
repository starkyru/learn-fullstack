/**
 * WORKED EXAMPLE — a raw Three.js scene, built by hand with no react-three-fiber.
 *
 * This is what r3f generates for you under the hood: a `Scene` graph (a `Mesh` + a light), a
 * `PerspectiveCamera`, and a per-frame update loop. The renderer is the ONLY piece that needs a
 * GPU/WebGL context, so we take it as an INJECTED interface — everything else (scene graph, camera,
 * animation math) is plain objects that construct and run headless in Node.
 *
 *   - `buildCubeScene()` wires a `BoxGeometry` + `MeshStandardMaterial` mesh and a light into a
 *     `Scene`, plus a `PerspectiveCamera` off to the side.
 *   - `stepAnimation(mesh, dt)` advances `rotation.y` by `dt * SPIN_SPEED` — framerate-independent
 *     spin: multiply the angular speed (rad/s) by the elapsed seconds, never by a raw frame count.
 */
import * as THREE from "three";

/** Angular speed of the spin, in radians per second. */
export const SPIN_SPEED = 1;

/** The only GPU-bound seam: in the browser this is a `WebGLRenderer`; in a test, a spy. */
export interface Renderer {
  render(scene: THREE.Scene, camera: THREE.Camera): void;
}

export interface CubeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh: THREE.Mesh;
  light: THREE.Light;
}

export function buildCubeScene(): CubeScene {
  const scene = new THREE.Scene();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x6699ff }),
  );
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 3, 3);
  scene.add(mesh, light);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  return { scene, camera, mesh, light };
}

export function stepAnimation(mesh: THREE.Object3D, dt: number): void {
  mesh.rotation.y += dt * SPIN_SPEED;
}

/**
 * YOUR TURN (analog) — the render loop that DRIVES the scene.
 *
 * Run `frames` iterations; on each frame advance the mesh with `stepAnimation(deps.mesh, dt)` and
 * then draw one frame via the injected `deps.renderer.render(deps.scene, deps.camera)`. In the
 * browser this is the `requestAnimationFrame` callback body; here it is a plain loop so it is
 * deterministic and needs no GL context.
 */
export interface FrameDeps {
  renderer: Renderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  mesh: THREE.Object3D;
}

export function runFrames(_deps: FrameDeps, _dt: number, _frames: number): void {
  throw new Error(
    "TODO: loop `frames` times — stepAnimation(deps.mesh, dt) then deps.renderer.render(deps.scene, deps.camera)",
  );
}
