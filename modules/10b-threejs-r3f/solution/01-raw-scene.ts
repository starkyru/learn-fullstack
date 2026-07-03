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

export function stepAnimation(
  mesh: THREE.Object3D,
  dt: number,
  speed: number = SPIN_SPEED,
): void {
  mesh.rotation.y += dt * speed;
}

export interface FrameDeps {
  renderer: Renderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  mesh: THREE.Object3D;
}

export function runFrames(deps: FrameDeps, dt: number, frames: number): void {
  for (let i = 0; i < frames; i++) {
    stepAnimation(deps.mesh, dt);
    deps.renderer.render(deps.scene, deps.camera);
  }
}
