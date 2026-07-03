# Module 05c — CSS & React Animations 🟡 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Motion done right — compositor-only, FLIP, reduced-motion. Animation that stays at 60fps is
animation that only touches `transform` and `opacity` (the compositor can move a layer without
re-running layout or paint). Everything here extracts the **decision + math** from the pixels:
the transition/keyframe builders are pure style objects, FLIP is arithmetic over two rects, the
Framer Motion list is a pure reducer under a shipped component artifact, and the View Transitions
helper is a two-branch decision you can inject. The `.tsx`/`framer-motion` pieces **ship as
artifacts** the module documents; the gate unit-tests the logic with **no browser or GPU**.

## Concepts

- **Compositor-only or bust** — animating `top`/`left`/`width`/`height` re-runs layout every frame
  and janks. Animating `transform` (translate/scale) and `opacity` runs on the compositor thread.
  So every "move" is a `translate`, every "resize" is a `scale`, and every "fade" is `opacity`; the
  builders here refuse to emit a layout property, and a `usesOnlyCompositorProps` guard proves it.
- **FLIP = First, Last, Invert, Play** — measure the element's rect **First**, mutate the DOM to its
  **Last** rect, then apply an **Inverted** `translate`+`scale` that makes it _look_ like it never
  moved, and finally **Play** by transitioning that transform back to identity. No animation library
  — just `first.x - last.x` and `first.width / last.width`.
- **Exit before unmount** — a delete can't just drop the node; the item must stay mounted through its
  exit animation. `AnimatePresence` models this as state: a removed key moves to an _exiting_ set
  (still rendered), and only an `exited` event unmounts it. That's a pure reducer you can test.
- **Collapse to instant under reduced-motion** — every animated path takes a `reducedMotion` flag (or
  a missing `startViewTransition`) and applies the DOM update **instantly** instead. Inject the
  capability and the flag and both branches are unit-testable.

## Tasks

| #   | Task                              | Lane | Type | What you build                                                                                     |
| --- | --------------------------------- | ---- | ---- | -------------------------------------------------------------------------------------------------- |
| 1   | Transitions + keyframes           | 🟢   | WE   | solved card hover/enter transition + analog stub — transform/opacity only                          |
| 2   | FLIP from scratch                 | 🔴   | FS   | flip() measuring first/last rects + inverted transform play — no animation lib                     |
| 3   | Framer Motion                     | 🟢   | TODO | list reorder with layout + AnimatePresence exit on card delete                                     |
| 4   | View Transitions + reduced-motion | 🟡   | EXT  | animate a list/route change via the View Transitions API; collapse to instant under reduced-motion |

## Done when

- [ ] Every transition/keyframe the builders emit references `transform`/`opacity` only — never a
      layout prop (`top`/`left`/`width`/`height`); `usesOnlyCompositorProps` returns `true`.
- [ ] `flip(first, last)` returns the inverted `translate(...)scale(...)` that maps `last → first`
      plus an identity `to`, with exact numbers, and reports `isNoop` when the rects are equal.
- [ ] The Framer Motion list ships as an artifact; its reducer keeps a deleted key **visible in the
      exiting set** (exit fires before unmount) and only drops it on the `exited` event.
- [ ] `withViewTransition` runs the update inside `startViewTransition` once on the animated path and
      applies it **instantly** (never calling `startViewTransition`) under reduced-motion / no support.

> **Testability:** CSS paint, real layout, and animation frames aren't unit-testable in jsdom, so the
> `.css`/`framer-motion` pieces ship as **artifacts** and the tests exercise the extracted logic.
> Worked-example (WE) tasks show a solved reference in `src/`; you complete the sibling stub.
> From-scratch (FS) / TODO stubs in `src/` throw `TODO` — implement each. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
