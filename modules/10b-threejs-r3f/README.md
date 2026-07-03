# Module 10b — 3D Graphics: Three.js & react-three-fiber 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Draw a spinning cube two ways — raw Three.js, then declaratively with react-three-fiber — load a
glTF model under `<Suspense>`, and finish with the two things every real scene must nail: click-to-
select picking and leak-free teardown. This is the 3D companion to module 10's Suspense work: the
`useGLTF` loader is the same resource pattern you already know, pointed at a GPU.

## Concepts

- **A scene is just a graph + a camera + a loop.** `buildCubeScene()` builds a `Scene` (a `Mesh` of
  `BoxGeometry` + `MeshStandardMaterial`, plus a light) and a `PerspectiveCamera`; a per-frame loop
  advances rotation and draws. Only the `WebGLRenderer` needs a GPU — so we take it as an **injected
  interface** and everything else runs headless in Node.
- **Framerate-independent motion.** Never spin by a fixed amount per frame; multiply an angular
  speed (rad/s) by the elapsed `delta` seconds. `stepAnimation` and the r3f `useFrame` callback both
  scale by `dt` so the cube spins at the same rate at 30fps or 144fps.
- **The GPU pieces are ARTIFACTS, the LOGIC is testable.** `<Canvas>`, `useFrame`, `OrbitControls`
  and `useGLTF` need a real WebGL context jsdom can't give — those ship as reference files under
  `artifacts/`. What the gate tests is the pure brain: the frame callback's math, the Suspense
  resource, `Raycaster` picking, and dispose traversal — three.js core objects construct fine in
  Node with no WebGL.
- **Teardown is not automatic.** GPU memory (geometries, materials, textures) is freed only when you
  call `.dispose()`. On unmount you must traverse the graph and dispose every resource **exactly
  once** — shared refs included — or you leak.

## Tasks

| #   | Task                            | Lane | Type | What you build                                                                     |
| --- | ------------------------------- | ---- | ---- | ---------------------------------------------------------------------------------- |
| 1   | Raw Three.js scene              | 🟡   | WE   | solved spinning-cube scene (renderer/camera/mesh/rAF loop) + analog stub           |
| 2   | Declarative r3f scene           | 🟢   | TODO | port the cube to `<Canvas>` + useFrame; add OrbitControls (drei)                   |
| 3   | Load a model under Suspense     | 🟢   | TODO | useGLTF a model behind `<Suspense>` fallback (ties to module 10)                   |
| 4   | Interaction + dispose (no leak) | 🔴   | FS   | raycast click-to-select + manual dispose of all GPU resources on unmount — no leak |

## Theory & docs

- **Raw Three.js scene** — [Three.js manual: fundamentals](https://threejs.org/manual/#en/fundamentals),
  [Three.js docs](https://threejs.org/docs/)
- **Declarative r3f scene** — [react-three-fiber: introduction](https://r3f.docs.pmnd.rs/getting-started/introduction),
  [r3f hooks (`useFrame`)](https://r3f.docs.pmnd.rs/api/hooks)
- **Load a model under Suspense** — [r3f: loading models](https://r3f.docs.pmnd.rs/tutorials/loading-models),
  [`<Suspense>` (react.dev)](https://react.dev/reference/react/Suspense)
- **Interaction + dispose (no leak)** — [`Raycaster`](https://threejs.org/docs/#api/en/core/Raycaster),
  [r3f events](https://r3f.docs.pmnd.rs/api/events),
  [How to dispose of objects](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)

## Done when

- [ ] `buildCubeScene()` returns a `Scene` holding a `Mesh(BoxGeometry, MeshStandardMaterial)` + a
      light and a `PerspectiveCamera`; `stepAnimation(mesh, dt)` advances `rotation.y` by exactly
      `dt * SPIN_SPEED`; `runFrames` draws once per frame through the **injected** renderer.
- [ ] `spinOnFrame(target, delta, speed?)` — the r3f `useFrame` callback logic — advances both axes
      by `delta * speed` in place. The `<Canvas>` version ships in `artifacts/SpinningCube.tsx`.
- [ ] `loadModel(url, loader)` returns a Suspense resource whose `read()` throws the pending promise
      while loading, throws on failure, and returns the parsed `gltf.scene` once resolved. The
      `<Suspense>` component ships in `artifacts/ModelViewer.tsx`.
- [ ] `selectAt(raycaster, camera, meshes, ndc)` returns the nearest clicked mesh (or `null`);
      `disposeObject(root)` frees every geometry/material/texture exactly once — no double-free, no
      leak.

## Artifacts (GPU-only, not gated)

`artifacts/SpinningCube.tsx` and `artifacts/ModelViewer.tsx` are the real `<Canvas>` components. They
are excluded from `tsconfig` `include` and from the test run because they require a WebGL context;
each imports the unit-tested logic from `solution/` so the reference and the tested brain stay in
sync. They also need `@react-three/drei` (OrbitControls / useGLTF) in the consuming app.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. **TODO** tasks throw until
> you fill them in; **WE** ships a solved reference plus an analog stub for you to complete. Tests
> import from `solution/`; flip to `../src/...` to grade your own build.
