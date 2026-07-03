# Module 28c — Build a Micro-Frontend Runtime (Module-Federation-like) 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Implement a Module-Federation-style micro-frontend runtime from scratch — no library, framework-agnostic
pure TS. A "micro-frontend" is modeled as the smallest useful contract: `mount(el, props) => unmount`.
You build the remote registry (dynamic loading with dedupe + cache), the shared-singleton negotiation
(hand-rolled semver, highest-satisfying-wins), and the host shell that mounts and tears remotes down
without leaking. Finishing this makes Webpack/Vite Module Federation feel like something you already wrote.

## Concepts

- **A remote is a lazily-fetched container** — `register(name, loader)` stores a `loader` that resolves
  a `remoteEntry` (a `Record<moduleName, RemoteModule>`). `loadRemote` must fetch it AT MOST ONCE:
  cache the loader's promise on first use so concurrent and later calls reuse it (in-flight dedupe),
  then pick the exposed module by name. That "load once, share everywhere" is the whole point of a host.
- **Shared deps are negotiated, not duplicated** — many remotes each declare a version of a shared lib;
  the host resolves ONE instance per name. Among every provided version that _satisfies_ the consumer's
  range (`*` / `^` / `~` / exact), pick the HIGHEST and instantiate it once (a true singleton cached per
  `(name, version)`). A tiny `parseVersion` / `compareVersions` / `satisfies` drives it — no semver lib.
- **The shell owns the lifecycle** — `mount` calls `remoteModule.mount(el, props)` and keeps the
  returned disposer keyed by a deterministic `mountId` (`m1`, `m2`, … from a counter — never
  `Math.random()`/`Date.now()`). `unmount` runs that disposer exactly once and drops the reference so
  nothing leaks; a mount that throws is isolated and never touches the active-mount count.

## Tasks

| #   | Task                          | Lane | Type | What you build                                               |
| --- | ----------------------------- | ---- | ---- | ------------------------------------------------------------ |
| 1   | Remote registry + loader      | 🔴   | FS   | `createRemoteRegistry()` with dedupe + cache + `clear`       |
| 2   | Shared-singleton negotiation  | 🔴   | FS   | hand-rolled semver + highest-satisfying-wins singleton scope |
| 3   | Shell mount/unmount lifecycle | 🔴   | FS   | `createShell(registry)` with leak-free `mount`/`unmount`     |

## Theory & docs

- **Remote registry + loader** — [Module Federation](https://module-federation.io/) (the real
  runtime this module reimplements),
  [MDN dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
- **Shared-singleton negotiation** — [the semver spec](https://semver.org/) behind
  `parseVersion`/`compareVersions`/`satisfies`.
- **Shell mount/unmount lifecycle** —
  [MDN memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
  (reachability — why a kept disposer reference is a leak),
  [MDN custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
  for the closest platform analog of a mount/unmount contract.

## Done when

- [ ] `loadRemote` runs each remote's loader AT MOST ONCE under concurrent calls, caches the resolved
      container, picks the exposed module by name, and throws a clear error for unknown remote/module;
      `clear()` drops the cache so the next load re-invokes the loader.
- [ ] `createSharedScope` picks the HIGHEST provided version satisfying the range, instantiates its
      factory once (same singleton on every `get`), throws when nothing satisfies, and its exported
      `parseVersion`/`compareVersions`/`satisfies` pass the `*`/`^`/`~`/exact cases.
- [ ] `createShell` mounts via the registry, unmounts each disposer EXACTLY once and releases it (no
      leak), assigns deterministic distinct `mountId`s, tears everything down with `unmountAll`, and
      isolates a throwing mount so `mountedCount()` is unchanged.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build.
