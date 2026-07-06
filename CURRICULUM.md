# CURRICULUM.md — learn-fullstack

> The **authoritative, detailed curriculum**. Each module below lists its objective,
> key concepts, a numbered task table (every task tagged with a depth lane 🟢/🟡/🔴 **and**
> a task-type WE/TODO/FS/EXT), and a "Done when" checklist. Each module's own
> `modules/NN-*/README.md` is the in-repo source of truth once written; this file is the
> master plan they're built from. See also [`README.md`](./README.md),
> [`AGENTS.md`](./AGENTS.md), [`PROGRESS.md`](./PROGRESS.md), and the capstone specs in
> [`docs/CAPSTONES.md`](./docs/CAPSTONES.md).

**Keep in sync (hard rule):** any change to a lesson updates this file **and** the root
`README.md` table **and** `PROGRESS.md` — see `AGENTS.md`.

**Legend:** lanes 🟢 App · 🟡 Balanced · 🔴 Deep (forbids the obvious library). Types
`WE` worked-example+analog · `TODO` cold hint stub · `FS` from-scratch 🔴 · `EXT`
extend/refactor.

30 numbered modules (00–29) + 14 lettered companion deep-dives (05b, 05c, 07b, 08b,
10b, 11b, 13b, 14b, 20b, 21b, 23b, 24b, 28b, 28c). Each module: concepts → a numbered **task table**
(every task tagged with a lane 🟢/🟡/🔴 **and** a type WE/TODO/FS/EXT) → a "Done when"
checklist. `WE` = worked-example+analog · `TODO` = cold hint stub · `FS` = from-scratch
🔴 · `EXT` = extend/refactor.

**Prereq graph (in words):** `00` (monorepo) + `01` (TS) gate everything. A **frontend
track** `05 → 06 → 07 → {08, 09, 10} → 11 → {12, 13, 14}` and a **backend track**
`04 → 15 → 16 → 17 → 18 → {19, 20}` run in parallel; CSS (`05b`) slots beside React Core.
They converge at cross-cutting modules: `21` Auth needs `18` (Guards) + `16` (a user
table) + `01` (zod); `22` Realtime needs `18` (gateway) + `10` (`useSyncExternalStore`);
`23–25` Next needs `05–10` + calls `16` from RSCs/Server Actions; `26` Testing weaves
across; `27` Ops needs the Postgres of `15/16` + deploy targets of `18/23`; `28`
Perf/Debug lands late. **Capstone 🅰 (Trellix)** pulls `11, 14, 16, 20, 21 (Auth.js),
23–25`; **Capstone 🅱 (Pulse)** pulls `12, 15, 17–19, 21 (JWT/Passport), 22`. Companions
are optional deepenings that don't block the main path.

### 00 — Setup & Monorepo Tooling ✅ implemented

Stand up the pnpm + Turborepo monorepo and shared config so every later module has a home.
Concepts: pnpm workspaces, `turbo.json` pipeline, `workspace:*`, the shared `packages/*` spine, env-as-a-contract via `@learn-fullstack/config`.

| #   | Task                | Lane | Type | Build                                                                   |
| --- | ------------------- | ---- | ---- | ----------------------------------------------------------------------- |
| 1   | Tour the pipeline   | 🟢   | TODO | run `pnpm typecheck && pnpm test`; read `turbo.json`; explain `^build`  |
| 2   | Validate env config | 🟢   | WE   | `readAppConfig()` is solved; write the analog `requireEnv()`            |
| 3   | Compose up Postgres | 🟢   | TODO | `pnpm db:up && pnpm db:migrate && pnpm db:seed`; confirm the row exists |

**Done when:** `pnpm typecheck && pnpm test` is green · `requireEnv()` returns a set key and throws for a missing one · `db:up && db:migrate && db:seed` succeeds.

### 01 — TypeScript for Full-Stack ✅ implemented

Model data so illegal states don't compile, and let one zod schema be the single source of truth shared by client and server. Concepts: discriminated unions + narrowing, generics & utility types, `as const`, `satisfies`, type guards, `keyof`/indexed access, mapped & template-literal types, exhaustiveness with `assertNever`, zod ↔ TS inference.

| #   | Task                       | Lane | Type | Build                                                                           |
| --- | -------------------------- | ---- | ---- | ------------------------------------------------------------------------------- |
| 1   | Model & narrow             | 🟢   | WE   | `area()` is solved; write the analog `label()` over the same `Shape` union      |
| 2   | Generic helpers            | 🟡   | TODO | `pick(obj, keys)` and a `Result<T, E>` `ok`/`err` pair — no `any`               |
| 3   | One schema, two ends       | 🟢   | WE   | `parseUser()` is solved (uses `@learn-fullstack/shared`); write `parseLogin()`  |
| 4   | Exhaustiveness 🔴          | 🔴   | FS   | `assertNever` so adding a `Shape` variant fails to compile until handled        |
| 5   | Const assertions           | 🟢   | WE   | `indexOfLevel()` is solved; const-assert `PRIORITIES` and write `rankOf()`      |
| 6   | Validate without widening  | 🟡   | WE   | `endpoint()` is solved; add `satisfies` to `THEME` and write `colorOf()`        |
| 7   | Utility types              | 🟡   | TODO | `applyPatch()` with `Partial<T>` and `indexById()` returning `Record<string,T>` |
| 8   | Type guards                | 🟢   | WE   | `isDefined`/`compact` are solved; write the `isString(x): x is string` analog   |
| 9   | Typed property access      | 🟡   | TODO | `getProp(obj, key): T[K]` and `pluck(items, key): T[K][]` via `keyof`           |
| 10  | Mapped & template types 🔴 | 🔴   | FS   | `Getters<T>` remaps keys to `` `get${Capitalize<K>}` `` + `makeGetters()`       |

**Done when:** `typecheck` is clean under `strict` (no `any`) · `label()` right for every `Shape`; `pick` fully typed · `parseLogin()` accepts a valid login, rejects a short password · adding a `Shape` variant makes task 4 fail to compile · `rankOf()`/`colorOf()` typed via `as const`/`satisfies` · `applyPatch`/`indexById`/`isString`/`getProp`/`pluck`/`makeGetters` implemented and green.

### 02 — Modern JavaScript & Async ✅ implemented

The language + async model under React and Node. Concepts: ES modules, closures/scope, promises, async/await, microtask vs macrotask, iterators/generators, `AbortController`.

| #   | Task                   | Lane | Type | Build                                                            |
| --- | ---------------------- | ---- | ---- | ---------------------------------------------------------------- |
| 1   | Promises & async/await | 🟢   | WE   | solved `retry()` + analog `withTimeout()` stub (races a timeout) |
| 2   | Event-loop ordering    | 🟡   | TODO | predict then verify sync/microtask/macrotask order               |
| 3   | Async iterators        | 🔴   | FS   | an async generator paginating a fake API — no library            |
| 4   | Concurrency control    | 🟡   | TODO | `pMap(items, fn, {concurrency})` — a mini p-limit                |

**Done when:** `retry` backs off and honors `AbortSignal` · you can explain a printed ordering trace · `pMap` never exceeds the cap.

### 03 — HTTP & the Web Platform ✅ implemented

The wire protocol + browser primitives full-stack apps sit on. Concepts: methods/status/headers, cookies (HttpOnly/SameSite/Secure), CORS + preflight, caching/ETag, `fetch`/`Request`/`Response`, `URL`/`searchParams`.

| #   | Task                   | Lane | Type | Build                                                              |
| --- | ---------------------- | ---- | ---- | ------------------------------------------------------------------ |
| 1   | Raw HTTP client        | 🟢   | WE   | solved `httpGet` + analog `httpPost` over `fetch`                  |
| 2   | CORS & cookies lab     | 🟡   | TODO | set a SameSite cookie; reproduce then fix a CORS preflight failure |
| 3   | HTTP cache semantics   | 🟢   | TODO | add ETag/Cache-Control; verify 304s with `curl`                    |
| 4   | Mini fetch retry/queue | 🔴   | FS   | wrap `fetch` with timeout + retry + in-flight dedupe — no axios    |

**Done when:** you can name every header's job · the CORS repro fails then passes · conditional requests return 304.

### 04 — Node.js Fundamentals ✅ implemented

Node's runtime: modules, event loop, streams, fs, http. Concepts: CJS vs ESM, event-loop phases + libuv, `EventEmitter`, streams/backpressure, `Buffer`, `fs/promises`, `http.createServer`.

| #   | Task                         | Lane | Type | Build                                                                      |
| --- | ---------------------------- | ---- | ---- | -------------------------------------------------------------------------- |
| 1   | HTTP server from `node:http` | 🟢   | WE   | solved JSON route handler + analog second-route stub (no Express)          |
| 2   | Streams & backpressure       | 🔴   | FS   | pipe a large file through a transform; prove backpressure — no helper libs |
| 3   | Typed EventEmitter           | 🟡   | TODO | an `EventBus<Events>` (reused later by the chat gateway)                   |
| 4   | File-based cache             | 🟢   | TODO | a tiny `fs/promises` KV cache with TTL                                     |

**Done when:** the server streams a large file without buffering it all · the transform respects backpressure · `EventBus` is fully typed.

### 05 — React Core ✅ implemented

Render UIs with components, props, state. Concepts: JSX, components/props, rendering & reconciliation, lists/keys, controlled inputs, events, **`useState`** & **`useEffect`** (intro).

| #   | Task                 | Lane | Type | Build                                                                      |
| --- | -------------------- | ---- | ---- | -------------------------------------------------------------------------- |
| 1   | Components & props   | 🟢   | WE   | solved `<Card>` + analog `<Badge>` stub                                    |
| 2   | Lists, keys & state  | 🟢   | TODO | a `<CardList>` that adds/removes cards with `useState`                     |
| 3   | Effects & data fetch | 🟡   | TODO | a `useBoardName` hook: fetch in `useEffect` with loading/error + cleanup   |
| 4   | Component variants   | 🟢   | WE   | solved `cardVariants` + analog `badgeVariants` (story-ready for module 11) |

**Done when:** `<Badge>` renders label + variant class · `<CardList>` adds/removes immutably · `useBoardName` returns `{loading,error,name}` and cleans up · `badgeVariants` lists every variant.

### 05b — CSS & Modern Layout (companion) ✅ implemented

Style UIs by hand before reaching for Tailwind — the fundamentals a component-library author needs. Concepts: box model, **Flexbox**, **Grid** (+ subgrid), positioning/stacking, **responsive** (media **and** container queries), **custom properties**/theming, fluid type (`clamp()`), logical properties, **transitions + keyframe animations + transforms**, scroll-driven animations, `:has()`/nesting, dark mode, `prefers-reduced-motion`, a11y focus states.

| #   | Task                              | Lane | Type | Build                                                                         |
| --- | --------------------------------- | ---- | ---- | ----------------------------------------------------------------------------- |
| 1   | Flexbox + Grid layout             | 🟢   | WE   | solved board-column flex layout + analog card-grid stub                       |
| 2   | Responsive + container queries    | 🟡   | TODO | a layout that reflows by container width; fluid type with `clamp()`           |
| 3   | Theming with custom properties    | 🟢   | TODO | light/dark theme via CSS variables + `prefers-color-scheme`                   |
| 4   | Animations & motion               | 🟡   | TODO | keyframe card-drop + transitions; respect `prefers-reduced-motion`            |
| 5   | Layout from scratch, no framework | 🔴   | FS   | rebuild a real UI (modal + responsive board) in pure CSS — no Tailwind/UI kit |

**Done when:** the layout holds at every breakpoint (Grid + container queries) · theme switches via a single custom-property swap · animations honor reduced-motion · zero utility-framework classes used.

### 05c — CSS & React Animations (companion) ✅ implemented

Motion done right — performant, accessible, interruptible. Concepts: CSS transitions/keyframes/transforms, the **compositor** (animate `transform`/`opacity` only, avoid layout thrash), the **FLIP** technique, the **Web Animations API**, spring vs easing, **Framer Motion** (`motion/react`: `animate`, `layout`, `AnimatePresence` exit, stagger), **React Spring** (survey), the **View Transitions API** (+ React), scroll-linked animation, `prefers-reduced-motion` as a first-class gate.

| #   | Task                              | Lane | Type | Build                                                                                              |
| --- | --------------------------------- | ---- | ---- | -------------------------------------------------------------------------------------------------- |
| 1   | Transitions + keyframes           | 🟢   | WE   | solved card hover/enter transition + analog stub — `transform`/`opacity` only                      |
| 2   | FLIP from scratch                 | 🔴   | FS   | `flip()` measuring first/last rects + inverted transform play — no animation lib                   |
| 3   | Framer Motion                     | 🟢   | TODO | list reorder with `layout` + `AnimatePresence` exit on card delete                                 |
| 4   | View Transitions + reduced-motion | 🟡   | EXT  | animate a list/route change via the View Transitions API; collapse to instant under reduced-motion |

**Done when:** animations run on `transform`/`opacity` (no layout thrash) · `flip()` animates a reorder with no library · exit animations fire before unmount · everything collapses to instant under `prefers-reduced-motion`.

### 06 — React Hooks I: State, Refs & Effects ✅ implemented

Core stateful hooks and their timing. Concepts: **`useState`**, **`useReducer`**, **`useEffect`** vs **`useLayoutEffect`**, **`useRef`**, **`useId`**, dependency arrays/cleanup, batching.

| #   | Task                     | Lane | Type | Build                                                  |
| --- | ------------------------ | ---- | ---- | ------------------------------------------------------ |
| 1   | useReducer               | 🟢   | WE   | solved `useToggle` + analog `useCounter`               |
| 2   | useRef & useLayoutEffect | 🟡   | TODO | `usePrevious(value)` — the last value, via `useRef`    |
| 3   | useId in forms           | 🟢   | TODO | a `<Field>` linking `<label>` to `<input>` via `useId` |
| 4   | Reducer-driven board     | 🟡   | TODO | a pure `boardReducer` (add / rename / move card)       |

**Done when:** `useCounter` exposes `count` + `inc`/`dec`/`reset` · `usePrevious` returns `undefined` then the prior value · `<Field>`'s label `htmlFor` equals its input `id` · `boardReducer` handles add/rename/move immutably.

### 07 — React Hooks II: Context, Memo & Custom Hooks ✅ implemented

Share state and factor logic into reusable hooks — and learn the best-practices for **minimizing re-renders** (see `docs/REACT_PERFORMANCE.md`). Concepts: **`useContext`** + provider, **split context** (state vs setter), **`useMemo`**, **`useCallback`**, `React.memo`, stable prop identities, **`useImperativeHandle`**, custom hooks, **`createPortal`**.

| #   | Task                        | Lane | Type | Build                                                                                  |
| --- | --------------------------- | ---- | ---- | -------------------------------------------------------------------------------------- |
| 1   | Custom hook                 | 🟢   | WE   | solved `useLocalStorage` + analog `useDebounce`                                        |
| 2   | Context provider            | 🟡   | TODO | a **split-context** `ThemeProvider` so dispatch-only consumers don't re-render         |
| 3   | Portals & imperative handle | 🟡   | TODO | a `Modal` via `createPortal` exposing `focus()` through `useImperativeHandle`          |
| 4   | Memoization                 | 🟢   | EXT  | fix a wasteful parent/child with `React.memo` + `useCallback` (prove no wasted render) |

**Done when:** `useDebounce` returns the latest value only after the delay · a setter-only consumer does NOT re-render on theme change · `modalRef.current.focus()` focuses the portal's Close button · bumping unrelated parent state does NOT re-render the memoized child.

### 07b — Hand-Rolled Hooks (companion 🔴) ✅ implemented

Demystify hooks by building a tiny React-like renderer. Concepts: fiber-lite render loop, hook dispatcher, hooks array + closures, why hook order must be stable.

| #   | Task                    | Lane | Type | Build                                                   |
| --- | ----------------------- | ---- | ---- | ------------------------------------------------------- |
| 1   | `useState` from scratch | 🔴   | FS   | a mini renderer with a hooks array + working `useState` |
| 2   | `useEffect` + deps      | 🔴   | FS   | effect scheduling with dependency compare + cleanup     |
| 3   | `useMemo`/`useRef`      | 🔴   | FS   | memo cell + persistent ref cell                         |

**Done when:** a counter re-renders via your dispatcher · effects run only on dep change and clean up · you can explain rules-of-hooks as an implementation constraint.

### 08 — React Patterns & Performance ✅ implemented

Reusable component patterns + keeping React fast (see `docs/REACT_PERFORMANCE.md`). Concepts: compound components, render-props, HOC, `React.memo` + stable identities, virtualization/windowing, identity/keys, profiler.

| #   | Task               | Lane | Type | Build                                                                             |
| --- | ------------------ | ---- | ---- | --------------------------------------------------------------------------------- |
| 1   | Compound component | 🟢   | WE   | solved `<Tabs>` compound API + analog `<Accordion>` stub                          |
| 2   | Render-props & HOC | 🟡   | TODO | a `<Toggle render>` + a `withDisabled(Component)` HOC                             |
| 3   | Virtualized board  | 🔴   | FS   | `visibleRange()` windowing + a list rendering only visible rows — no react-window |
| 4   | Perf pass          | 🟢   | EXT  | memoize a row so an unrelated list change doesn't re-render it (render-counter)   |

**Done when:** `<Accordion>` shares a headless context like `<Tabs>` · `<Toggle>`/`withDisabled` work · `visibleRange` windows correctly and only visible rows mount · toggling one row does NOT re-render the others.

### 08b — React Advanced Patterns (companion) ✅ implemented

Patterns component-library authors ship. Concepts: state-reducer pattern, headless/slot components, polymorphic `as` prop, prop getters, controllable state.

| #   | Task                  | Lane | Type | Build                                                                 |
| --- | --------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Polymorphic component | 🟡   | WE   | solved polymorphic `<Box as>` + analog `<Text as>` stub               |
| 2   | State-reducer pattern | 🔴   | FS   | a `useSelect` whose consumer can intercept/override transitions       |
| 3   | Prop getters + slots  | 🟡   | TODO | a headless `useDisclosure` returning `getButtonProps`/`getPanelProps` |

**Done when:** `<Box as="a">` type-checks `href` · the consumer can veto a transition · the headless hook drives two different UIs.

### 09 — Forms ✅ implemented

Validated, accessible forms the production way. Concepts: controlled vs uncontrolled, React Hook Form, zod resolver, field arrays, async validation, **TanStack Form** (survey), server-error mapping.

| #   | Task                  | Lane | Type | Build                                                           |
| --- | --------------------- | ---- | ---- | --------------------------------------------------------------- |
| 1   | Controlled form + zod | 🟢   | WE   | solved login form (zod) + analog signup form stub               |
| 2   | React Hook Form       | 🟡   | TODO | a "new card" form with RHF + `zodResolver` + a field array      |
| 3   | TanStack Form         | 🟢   | TODO | rebuild the card form with TanStack Form; note tradeoffs vs RHF |
| 4   | Async + server errors | 🟡   | EXT  | surface server validation errors onto the right fields          |

**Done when:** invalid input blocks submit with per-field messages · RHF and TanStack Form versions are behavior-equivalent · server errors map to fields.

### 10 — Concurrent React, Suspense & React 19 ✅ implemented

Suspense, error boundaries, concurrent/React-19 hooks. Concepts: **Suspense**, **error boundaries**, **`useTransition`**, **`useDeferredValue`**, **`useOptimistic`**, **`use()`**, streaming, transitions vs debounce.

| #   | Task                               | Lane | Type | Build                                                                            |
| --- | ---------------------------------- | ---- | ---- | -------------------------------------------------------------------------------- |
| 1   | Suspense + error boundary          | 🟢   | WE   | solved component reading a promise via `use()` + analog stub; wrap in a boundary |
| 2   | `useTransition`/`useDeferredValue` | 🟡   | TODO | keep a big filtered card list responsive while typing                            |
| 3   | `useOptimistic`                    | 🟡   | TODO | optimistic "add card" that rolls back on failure                                 |
| 4   | Concurrent pitfalls                | 🟢   | EXT  | fix a deliberately introduced tearing/stale-closure bug                          |

**Done when:** a thrown promise suspends and the boundary catches errors · typing stays responsive under load · the optimistic add rolls back on reject.

### 10b — 3D Graphics: Three.js & react-three-fiber (companion) ✅ implemented

Render 3D on the web and drive it declaratively from React — r3f leans on module-10 **Suspense** for asset loading. Concepts: the WebGL pipeline (**scene / camera / renderer**), geometry/material/mesh, lights, the **render loop** (rAF), **react-three-fiber** `<Canvas>` + **`useFrame`**, **drei** helpers (`OrbitControls`, `useGLTF`), **GLTF** model loading behind Suspense, **raycasting** / pointer events, and **GPU memory discipline** (dispose geometries/materials/textures, instancing for many objects) + a reduced-motion/perf budget.

| #   | Task                            | Lane | Type | Build                                                                              |
| --- | ------------------------------- | ---- | ---- | ---------------------------------------------------------------------------------- |
| 1   | Raw Three.js scene              | 🟡   | WE   | solved spinning-cube scene (renderer/camera/mesh/rAF loop) + analog stub           |
| 2   | Declarative r3f scene           | 🟢   | TODO | port the cube to `<Canvas>` + `useFrame`; add `OrbitControls` (drei)               |
| 3   | Load a model under Suspense     | 🟢   | TODO | `useGLTF` a model behind `<Suspense>` fallback (ties to module 10)                 |
| 4   | Interaction + dispose (no leak) | 🔴   | FS   | raycast click-to-select + manual dispose of all GPU resources on unmount — no leak |

**Done when:** the raw scene renders and animates via rAF · the r3f version matches with `useFrame` · a model streams in behind Suspense · clicking an object selects it · unmounting disposes every geometry/material/texture (heap does not grow across mount/unmount cycles).

### 11 — Component Library, Storybook & Tailwind (`packages/ui`) ✅ implemented

Ship `packages/ui` as a real, documented library **and** learn the styling options. Concepts: stories/args/controls, **a11y addon**, **`@storybook/test`** play/interaction tests, **Tailwind** preset/tokens/theming, **CSS Modules vs Tailwind vs CSS-in-JS — when to use which**, publishing/consuming across apps.

| #   | Task                        | Lane | Type | Build                                                                                                                               |
| --- | --------------------------- | ---- | ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Primitives + stories        | 🟢   | WE   | solved Button (variants)+story + analog Input stub+story                                                                            |
| 2   | Tailwind preset + theming   | 🟢   | TODO | design tokens → Tailwind preset; theme via CSS vars; dark mode                                                                      |
| 3   | Overlay components          | 🟡   | TODO | Modal/Toast on the portal + a11y patterns from module 07                                                                            |
| 4   | Interaction tests           | 🟡   | TODO | `@storybook/test` play functions (focus trap, click)                                                                                |
| 5   | DataTable + styling compare | 🔴   | FS   | a headless DataTable (sort/select), styled once in Tailwind and once in CSS Modules — write the tradeoff note (→ `docs/STYLING.md`) |
| 6   | Consume in both apps        | 🟢   | EXT  | wire `packages/ui` into `apps/kanban-web` (Tailwind) and `apps/chat-web` (CSS Modules)                                              |

**Done when:** Storybook builds with a11y checks green · play tests assert focus trap + interactions · the Tailwind preset themes both light/dark · both apps import the same `Button` · the styling-tradeoff note is committed.

### 11b — Accessibility & WCAG (companion) ✅ implemented

Extends module 11: every `packages/ui` component must be accessible. Concepts: semantic HTML + ARIA (roles/states, first-rule-of-ARIA), color contrast & WCAG 2.1 levels (A/AA/AAA), focus management (traps, restore, visible ring), keyboard navigation (roving tabindex), `prefers-reduced-motion`.

| #   | Task                  | Lane | Type | Build                                                                       |
| --- | --------------------- | ---- | ---- | --------------------------------------------------------------------------- |
| 1   | Semantic HTML & ARIA  | 🟢   | WE   | solved `IconButton` (aria-label) + analog `ToggleButton` (aria-pressed)     |
| 2   | Color contrast (WCAG) | 🔴   | FS   | `contrastRatio(fg, bg)` + `meetsWCAG()` from the luminance formula — no lib |
| 3   | Focus management      | 🟡   | TODO | `getFocusableElements(container)` in DOM order (for a focus trap)           |
| 4   | Keyboard navigation   | 🟡   | TODO | `nextRovingIndex(current, key, count)` for arrow/Home/End                   |

**Done when:** `ToggleButton` exposes `aria-pressed` · `contrastRatio("#000","#fff")` is 21 and `meetsWCAG` enforces AA/AAA · `getFocusableElements` returns focusable non-disabled nodes in order · `nextRovingIndex` wraps on arrows and jumps on Home/End.

### 12 — State Management I: Redux Toolkit ✅ implemented

Model complex client state with RTK. Concepts: store/slices/reducers, immer, thunks, memoized selectors, **RTK Query**, custom middleware, devtools, when Redux is (and isn't) worth it.

| #   | Task              | Lane | Type | Build                                                        |
| --- | ----------------- | ---- | ---- | ------------------------------------------------------------ |
| 1   | Slice + selectors | 🟢   | WE   | solved `boardSlice` + analog `filtersSlice` stub             |
| 2   | Async thunks      | 🟡   | TODO | load/save via `createAsyncThunk` with loading/error          |
| 3   | RTK Query         | 🟡   | TODO | a cards API with cache tags, invalidation, optimistic update |
| 4   | Custom middleware | 🔴   | FS   | a logging/undo middleware from scratch                       |

**Done when:** selectors are memoized and typed · RTK Query auto-refetches on tag invalidation · undo middleware reverts the last action.

### 13 — State Management II: Zustand & External Stores ✅ implemented

Lightweight global state + the store contract behind it. Concepts: Zustand store/actions/slices, selectors + `shallow`, persist middleware, **`useSyncExternalStore`**, Context-vs-store tradeoffs.

| #   | Task                            | Lane | Type | Build                                                         |
| --- | ------------------------------- | ---- | ---- | ------------------------------------------------------------- |
| 1   | Zustand store                   | 🟢   | WE   | solved theme/UI store + analog board-UI store stub            |
| 2   | Selectors & slices              | 🟡   | TODO | split a big store; avoid re-renders with selector + `shallow` |
| 3   | Subscribe to an external source | 🟡   | TODO | bridge `window`/media-query via `useSyncExternalStore`        |
| 4   | Redux vs Zustand vs Context     | 🟢   | EXT  | same feature 3 ways + the "when to use which" note            |

**Done when:** the selector prevents unrelated re-renders · the external source updates via `useSyncExternalStore` · the comparison note is committed.

### 13b — Build a Mini Store (Zustand-like) (companion 🔴) ✅ implemented

Implement the external-store pattern from scratch. Concepts: `subscribe`/`getSnapshot`/`setState`, `useSyncExternalStore` binding, selector equality — no library.

| #   | Task          | Lane | Type | Build                                                      |
| --- | ------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | `createStore` | 🔴   | FS   | `create()` with `get`/`set`/`subscribe`                    |
| 2   | React binding | 🔴   | FS   | `useStore(selector, equalityFn)` on `useSyncExternalStore` |
| 3   | Middleware    | 🔴   | FS   | a `persist` + `devtools`-style wrapper                     |

**Done when:** a component re-renders only when its selected slice changes · `persist` rehydrates · the API mirrors Zustand's shape.

### 14 — Server State: TanStack Query & Ecosystem ✅ implemented

TanStack Query as the server-state layer + an ecosystem survey. Runs against the **MSW handlers in `packages/api-client`** (so it works before the real API exists). Concepts: queries/mutations, cache keys/`staleTime`, invalidation, **optimistic updates**, infinite/pagination, **SSR hydration**, **TanStack Table/Router/Form**.

| #   | Task                       | Lane | Type | Build                                                                                                 |
| --- | -------------------------- | ---- | ---- | ----------------------------------------------------------------------------------------------------- |
| 1   | Queries & mutations        | 🟢   | WE   | solved `useCards` query + analog `useLists` stub; mutation invalidates                                |
| 2   | Optimistic + infinite      | 🟡   | TODO | optimistic card move + infinite-scroll activity feed                                                  |
| 3   | SSR hydration              | 🟡   | TODO | prefetch + dehydrate/hydrate in a Next route                                                          |
| 4   | TanStack Table             | 🟢   | WE   | solved sortable users table + analog cards-table stub                                                 |
| 5   | TanStack Router/Form taste | 🟢   | TODO | one typed route + one form field (the **library** survey — distinct from the 23b from-scratch router) |

**Done when:** the mutation optimistically updates then reconciles on settle · the infinite query pages correctly · the SSR page hydrates without a refetch flash · the Table sorts/filters.

### 14b — Build a Mini Query Client (TanStack-like) (companion 🔴) ✅ implemented

Recreate the cache/dedupe/invalidation core. Concepts: keyed query cache, in-flight dedupe, `staleTime`/refetch, subscribers, invalidation — no library.

| #   | Task                | Lane | Type | Build                                                          |
| --- | ------------------- | ---- | ---- | -------------------------------------------------------------- |
| 1   | Query cache + fetch | 🔴   | FS   | keyed cache; dedupe concurrent fetches                         |
| 2   | `useQuery` hook     | 🔴   | FS   | subscribe via `useSyncExternalStore`; expose status/data/error |
| 3   | invalidate + mutate | 🔴   | FS   | invalidation + optimistic mutation with rollback               |

**Done when:** two components with the same key trigger one fetch · invalidation refetches subscribers · optimistic update rolls back on error.

### 15 — SQL & Postgres (raw) ✅ implemented

Real SQL against Postgres with a raw driver. Concepts: schema/DDL, joins/aggregations, B-tree **indexes**, **transactions**/isolation, **N+1**, **connection pooling**, node-postgres/postgres.js, parameterized queries (SQLi).

| #   | Task               | Lane | Type | Build                                                                           |
| --- | ------------------ | ---- | ---- | ------------------------------------------------------------------------------- |
| 1   | Schema + seed      | 🟢   | WE   | solved `users` DDL+query + analog `boards`/`cards` schema stub                  |
| 2   | Joins & pagination | 🟡   | TODO | keyset pagination + a 3-table join for the board view                           |
| 3   | Transactions       | 🟡   | TODO | move-card as an atomic transaction; prove rollback                              |
| 4   | Index & N+1 hunt   | 🔴   | FS   | reproduce an N+1 + a seq-scan; fix with a batched query + index; read `EXPLAIN` |
| 5   | Mini query builder | 🔴   | FS   | typed `from(t).where().limit()` → parameterized SQL — no Prisma/Drizzle/Knex    |

**Done when:** parameterized queries block an injection attempt · `EXPLAIN` shows the index used · the transaction rolls back cleanly.

### 16 — Prisma & `packages/db` ✅ implemented

Type-safe data access with Prisma as the shared db package. Concepts: schema/models/relations, migrations, Client queries, transactions, seeding, pooling, N+1 via `include`/`select`, Drizzle (alt note).

| #   | Task                | Lane | Type | Build                                                                  |
| --- | ------------------- | ---- | ---- | ---------------------------------------------------------------------- |
| 1   | Schema & migrate    | 🟢   | WE   | solved `User` model + analog `Board`/`List`/`Card` stub; `migrate dev` |
| 2   | Relations & queries | 🟡   | TODO | nested reads/writes for a board with lists+cards; typed results        |
| 3   | Transactions & seed | 🟡   | TODO | interactive transaction + a seed script both apps share                |
| 4   | Perf                | 🟢   | EXT  | fix a Prisma N+1 with `include`/`select`; add a compound index         |

**Done when:** `prisma migrate` produces the schema · the nested board query is fully typed · the seed populates both apps · the N+1 fix cuts query count.

### 17 — Node HTTP & Express ✅ implemented

Build a REST server with Express before NestJS. Concepts: routing, middleware chain, error-handling middleware, body parsing, `Router`, req/res lifecycle, why frameworks exist.

| #   | Task                    | Lane | Type | Build                                                      |
| --- | ----------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Express CRUD            | 🟢   | WE   | solved `GET/POST /cards` + analog `/lists` routes stub     |
| 2   | Middleware              | 🟡   | TODO | logging + auth + centralized error middleware              |
| 3   | Validation              | 🟢   | TODO | zod-validate request bodies; 400 on bad input              |
| 4   | Refactor toward modules | 🟡   | EXT  | split routes/services/repo layers (sets up the Nest model) |

**Done when:** CRUD returns correct status codes · error middleware catches thrown errors · invalid bodies return 400 with zod messages.

### 18 — NestJS Fundamentals ✅ implemented

The Nest building blocks powering the chat API. Concepts: modules, DI/providers, controllers, DTOs + **`ValidationPipe`**, guards, interceptors, middleware, `ConfigModule`, exception filters.

| #   | Task                          | Lane | Type | Build                                                               |
| --- | ----------------------------- | ---- | ---- | ------------------------------------------------------------------- |
| 1   | Module + controller + service | 🟢   | WE   | solved `CardsController/Service` + analog `ListsController` stub    |
| 2   | Pipes & validation            | 🟡   | TODO | DTO validation pipe + a custom parse pipe                           |
| 3   | Guards & interceptors         | 🟡   | TODO | an auth guard + a logging/timeout interceptor + an exception filter |
| 4   | Providers & DI                | 🔴   | FS   | a tiny DI container that explains Nest's injector, then map back    |

**Done when:** DI resolves a service into a controller · invalid DTOs are rejected · the filter shapes error responses · the guard blocks unauthenticated routes.

### 19 — REST API Design ✅ implemented

Design a clean, versioned REST API with docs. Concepts: resource modeling, status codes, idempotency, **versioning**, **pagination** (cursor/offset), filtering/sorting, **OpenAPI/Swagger**, RFC 7807 errors.

| #   | Task                   | Lane | Type | Build                                                      |
| --- | ---------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Resource design        | 🟢   | WE   | solved `/boards/:id/cards` design + analog `/lists` stub   |
| 2   | Pagination & filtering | 🟡   | TODO | cursor pagination + filter/sort query params               |
| 3   | OpenAPI/Swagger        | 🟢   | TODO | generate Swagger from Nest decorators; export the spec     |
| 4   | Typed client from spec | 🟡   | EXT  | generate `packages/api-client` types from the OpenAPI spec |

**Done when:** endpoints use correct status codes + `problem+json` errors · cursor pagination is stable under inserts · Swagger UI lists every route · the generated client type-checks.

### 20 — GraphQL End-to-End ✅ implemented

One GraphQL schema wired from NestJS backend to a React client — **both ends**. Concepts: code-first (Nest) resolvers, **DataLoader/N+1**, mutations, **subscriptions**, auth/context; frontend **Apollo/urql** + **GraphQL Code Generator**, normalized cache, optimistic updates; TanStack Query + graphql-request (alt).

| #   | Task                      | Lane | Type | Build                                                                                       |
| --- | ------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------- |
| 1   | Nest resolvers            | 🟢   | WE   | solved `usersResolver` + analog `postsResolver`/`cardsResolver` stub                        |
| 2   | DataLoader batching       | 🟡   | TODO | batch card→list lookups; prove N+1 is gone                                                  |
| 3   | Mutations + subscriptions | 🟡   | TODO | `addCard` mutation + `cardAdded` subscription with auth context                             |
| 4   | Typed React client        | 🟢   | WE   | solved codegen'd `useCardsQuery` + analog mutation-hook stub; normalized cache + optimistic |
| 5   | graphql-request alt       | 🟢   | EXT  | same query via TanStack Query + graphql-request; compare                                    |

**Done when:** client and server share one generated schema/types · DataLoader collapses N+1 into one batch · a subscription pushes a new card to another client · the optimistic mutation updates the normalized cache.

### 20b — From-Scratch DataLoader (companion 🔴) ✅ implemented

Build the batching/caching primitive yourself. Concepts: per-tick batch queue, key coalescing, cache map, `Promise` fan-out — no dataloader lib.

| #   | Task                 | Lane | Type | Build                                             |
| --- | -------------------- | ---- | ---- | ------------------------------------------------- |
| 1   | Batch scheduler      | 🔴   | FS   | collect keys within a tick, dispatch one batch    |
| 2   | Cache + dedupe       | 🔴   | FS   | memoize by key; dedupe concurrent loads           |
| 3   | Wire into a resolver | 🔴   | FS   | drop it into module 20's resolver; match behavior |

**Done when:** N loads in one tick call the batch fn once · repeated keys hit cache · it replaces the real DataLoader with equal results.

### 21 — Authentication & Security ✅ implemented

Compare the major auth approaches side-by-side and harden against OWASP. Concepts: **cookie/session** vs **JWT access+refresh rotation** vs **OAuth2/OIDC** vs **Auth.js** vs **Passport+Nest guards** vs **magic-link**; **argon2/bcrypt**; **RBAC vs ABAC**; **CSRF/XSS/OWASP Top-10**; zod validation. Reference: `docs/AUTH_COMPARISON.md`.

| #   | Task                   | Lane | Type | Build                                                                 |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Password + sessions    | 🟢   | WE   | solved argon2 hash + server-session login + analog logout/rotate stub |
| 2   | JWT access+refresh     | 🟡   | TODO | short access + rotating refresh (reuse detection) for the chat app    |
| 3   | OAuth/OIDC + Auth.js   | 🟢   | TODO | social login via Auth.js in the Kanban (Next) app                     |
| 4   | Passport + Nest guards | 🟡   | TODO | a JWT strategy + an RBAC guard on chat's Nest API                     |
| 5   | OWASP hardening        | 🔴   | FS   | exploit then fix CSRF + stored XSS; add CSRF tokens + escaping        |

**Done when:** the two apps use different stacks (Auth.js/session vs JWT/Passport) · refresh rotation detects token reuse · the RBAC guard blocks a forbidden role · the CSRF/XSS exploits are closed.

### 21b — From-Scratch Session Auth (Lucia-style) (companion 🔴) ✅ implemented

Hand-roll secure sessions to see exactly what libraries do. Concepts: session-id entropy, hashing tokens at rest, signed cookies, expiry/rotation, CSRF double-submit — no auth library.

| #   | Task                   | Lane | Type | Build                                                     |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------- |
| 1   | Session store + cookie | 🔴   | FS   | create/validate/rotate sessions; HttpOnly+SameSite cookie |
| 2   | CSRF protection        | 🔴   | FS   | double-submit token + origin check                        |
| 3   | Middleware guard       | 🔴   | FS   | a `requireSession` middleware for protected routes        |

**Done when:** a stolen cookie can't be forged (tokens hashed at rest) · sessions expire + rotate · a CSRF token mismatch is rejected.

### 22 — Realtime: WebSockets End-to-End ✅ implemented

Wire realtime from a NestJS gateway to a React `useSocket` client — full round-trip. Concepts: WS gateway (`@nestjs/websockets`/socket.io), rooms, **auth on the socket**, broadcasting; browser client, **`useSocket` on `useSyncExternalStore`**, connect/reconnect/backoff; **SSE** + **GraphQL subscriptions** (when-to-use). Reference: `docs/REALTIME.md`.

| #   | Task                   | Lane | Type | Build                                                                              |
| --- | ---------------------- | ---- | ---- | ---------------------------------------------------------------------------------- |
| 1   | Nest WS gateway        | 🟢   | WE   | solved `ChatGateway` (join room, broadcast) + analog `PresenceGateway` stub        |
| 2   | `useSocket` client     | 🔴   | FS   | a reconnecting `useSocket` on `useSyncExternalStore` (backoff, subscribe)          |
| 3   | End-to-end round trip  | 🟡   | TODO | client emits → gateway → broadcast → other clients update; authenticate the socket |
| 4   | SSE & GraphQL-subs alt | 🟢   | EXT  | same feed via SSE and via a GraphQL subscription; write the tradeoff note          |

**Done when:** two browsers see each other's messages in realtime · killing the server triggers backoff reconnect · unauthenticated sockets are rejected · the SSE/subscription alternatives work and are compared.

### 22b — Webhook Delivery (from scratch) (companion 🔴) ✅ implemented

Build the outbound half of a B2B webhook platform — Stripe-level expectations, no SaaS SDK. Concepts: HMAC signature with the **timestamp bound into the signed content**, constant-time compare + anti-replay window; retry with **exponential backoff** on transient failures only; **at-least-once ⇒ idempotent consumer** (dedupe by key, order per endpoint, detect gaps); a delivery log with **replay** + **dead-letter queue**. All over injected boundaries (transport/clock/sleep) — no `svix`/`bullmq`/Stripe SDK.

| #   | Task             | Lane | Type | Build                                                                                |
| --- | ---------------- | ---- | ---- | ------------------------------------------------------------------------------------ |
| 1   | Sign & verify    | 🟢   | WE   | solved HMAC `signWebhook` + analog `verifyWebhook` stub (constant-time, anti-replay) |
| 2   | Delivery & retry | 🟡   | TODO | `deliver` with exponential backoff; retry transient, stop on permanent 4xx           |
| 3   | Dedup & ordering | 🟡   | TODO | idempotency-key `dedupe` + per-endpoint ordering with gap detection                  |
| 4   | Replay & DLQ     | 🔴   | FS   | `replay` a delivery by id + a dead-letter queue — no `svix`/`bullmq`/Stripe SDK      |

**Done when:** a tampered payload / wrong secret / stale timestamp are all rejected · retries back off exponentially and skip permanent 4xx · redelivered ids are deduped and endpoint gaps surfaced · a delivery replays by id and exhausted ones land in the DLQ.

### 23 — Next.js Core (App Router & RSC) ✅ implemented

The App Router mental model: server vs client components. Concepts: file routing, layouts/templates, **RSC** vs client components, route handlers, **middleware**, `loading`/`error` files, navigation, colocated data fetching.

| #   | Task                        | Lane | Type | Build                                                      |
| --- | --------------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Routes & layouts            | 🟢   | WE   | solved board layout + analog card-detail route stub        |
| 2   | Server vs client components | 🟡   | TODO | server-render the board; make only interactive bits client |
| 3   | Route handlers + middleware | 🟢   | TODO | a route-handler API + auth middleware redirect             |
| 4   | Loading/error UI            | 🟢   | EXT  | add `loading.tsx`/`error.tsx` with Suspense boundaries     |

**Done when:** the board renders as RSC with minimal client JS · middleware redirects unauthenticated users · loading/error files show during navigation.

### 23b — Build a Mini File-Based Router (companion 🔴) ✅ implemented

Understand file-routing + nested layouts by building one. Concepts: route table from a file tree, dynamic segments, nested layouts, matching/params — no router lib.

| #   | Task              | Lane | Type | Build                                                     |
| --- | ----------------- | ---- | ---- | --------------------------------------------------------- |
| 1   | Route table       | 🔴   | FS   | scan a `routes/` tree into a matchable table              |
| 2   | Matcher + params  | 🔴   | FS   | match `/cards/:id`, extract params, pick the layout chain |
| 3   | Client navigation | 🔴   | FS   | History API + render the matched layout+page              |

**Done when:** nested layouts wrap the matched page · dynamic params resolve · back/forward works.

### 24 — Next.js Data, Rendering & SEO ✅ implemented

Caching, streaming, and the rendering strategies. Concepts: fetch caching + **revalidation** (ISR), **SSR/SSG/ISR**, streaming with **Suspense**, `generateMetadata`/SEO, **image/font optimization**, dynamic vs static.

| #   | Task                       | Lane | Type | Build                                                       |
| --- | -------------------------- | ---- | ---- | ----------------------------------------------------------- |
| 1   | Fetch caching & revalidate | 🟢   | WE   | solved cached board fetch + analog `revalidateTag` stub     |
| 2   | Streaming with Suspense    | 🟡   | TODO | stream the slow activity feed while the board renders       |
| 3   | SSG/ISR + metadata         | 🟢   | TODO | static marketing page + ISR + `generateMetadata` + OG image |
| 4   | Image/font optimization    | 🟢   | EXT  | `next/image` + `next/font`; measure LCP before/after        |

**Done when:** a tagged fetch revalidates on demand · the slow section streams in after the shell · metadata/OG render · LCP improves measurably.

### 24b — Next.js Advanced (companion) ✅ implemented

The production Next features interviews probe. Concepts: partial prerendering (PPR), parallel + intercepting routes, route groups, tag-based caching, edge runtime, draft mode.

| #   | Task                           | Lane | Type | Build                                                    |
| --- | ------------------------------ | ---- | ---- | -------------------------------------------------------- |
| 1   | Parallel + intercepting routes | 🟡   | TODO | a modal route that intercepts card detail                |
| 2   | Advanced caching               | 🟡   | TODO | tag-based cache + `revalidateTag` across routes          |
| 3   | PPR/edge                       | 🟢   | EXT  | opt a route into PPR; move a handler to the edge runtime |

**Done when:** card detail opens as an intercepted modal but deep-links as a full page · a mutation revalidates the right tags · the PPR route streams the dynamic hole.

### 25 — Server Actions & Full-Stack Next ✅ implemented

Mutations without a separate API using Server Actions. Concepts: **Server Actions**, `useActionState`/`useFormStatus`, **`useOptimistic`** with actions, progressive enhancement, revalidation, Auth.js session in actions.

| #   | Task                     | Lane | Type | Build                                                       |
| --- | ------------------------ | ---- | ---- | ----------------------------------------------------------- |
| 1   | Server Action mutation   | 🟢   | WE   | solved `createCard` action + analog `renameCard` stub       |
| 2   | Forms + `useActionState` | 🟡   | TODO | a card form posting to an action with pending/error state   |
| 3   | Optimistic actions       | 🟡   | TODO | `useOptimistic` card move; revalidate on settle             |
| 4   | Secure actions           | 🟢   | EXT  | authorize actions via Auth.js session + zod-validate inputs |

**Done when:** the form works without client JS (progressive enhancement) · the optimistic move reconciles after revalidate · unauthorized action calls are rejected.

### 26 — Testing (the trophy, end to end) ✅ implemented

Choose and combine testing approaches; wire `packages/testing`. Concepts: testing trophy/pyramid, **unit (Vitest)**, **component (RTL + Storybook play)**, **integration (Nest e2e + Testcontainers/pg)**, **E2E (Playwright)**, **MSW**, **TDD**, snapshot vs assertion, contract testing, when to use each. Reference: `docs/TESTING.md`.

| #   | Task             | Lane | Type | Build                                                                      |
| --- | ---------------- | ---- | ---- | -------------------------------------------------------------------------- |
| 1   | Unit + TDD       | 🟢   | WE   | solved TDD'd `moveCard` reducer test + analog `renameCard` test stub       |
| 2   | Component + MSW  | 🟡   | TODO | an RTL test of the board with MSW-mocked API + a Storybook play test       |
| 3   | Integration      | 🟡   | TODO | Nest e2e against ephemeral Postgres (Testcontainers) in `packages/testing` |
| 4   | E2E              | 🟢   | TODO | Playwright: log in → create card → see it                                  |
| 5   | When-to-use note | 🟢   | EXT  | the trophy note + a contract-test example                                  |

**Done when:** `turbo run test` runs unit+component+integration · MSW intercepts network in component tests · the Nest e2e spins up a real Postgres · the Playwright flow passes headless.

### 27 — Ops: Docker, CI/CD & Deploy ✅ implemented

Containerize, automate, ship both apps. Concepts: multi-stage Dockerfiles, **docker-compose** (Postgres), **GitHub Actions** matrix + Turborepo cache, env/secrets, **Vercel** (Next) + **Railway/Fly** (Nest), migrations in CI.

| #   | Task          | Lane | Type | Build                                                                      |
| --- | ------------- | ---- | ---- | -------------------------------------------------------------------------- |
| 1   | Dockerize     | 🟢   | WE   | solved multi-stage Dockerfile for chat API + analog worker Dockerfile stub |
| 2   | Compose stack | 🟡   | TODO | compose: Postgres + API + web; one `docker compose up`                     |
| 3   | CI pipeline   | 🟡   | TODO | GH Actions: install→typecheck→lint→test→build with turbo cache             |
| 4   | Deploy        | 🟢   | EXT  | Kanban→Vercel, chat API→Railway/Fly; run migrations on deploy              |

**Done when:** `docker compose up` boots the full stack · CI is green and skips unchanged cached tasks · both apps are reachable with migrations applied.

### 28 — Performance, Observability & Debugging ✅ implemented

Measure and improve full-stack performance; see inside prod. Concepts: Core Web Vitals, bundle analysis/code-splitting, DB query perf + caching (Redis note), **logging/tracing/metrics**, **OpenTelemetry**, Sentry, health checks.

| #   | Task                        | Lane | Type | Build                                                                |
| --- | --------------------------- | ---- | ---- | -------------------------------------------------------------------- |
| 1   | Frontend perf               | 🟢   | WE   | solved bundle-split fix + analog lazy-route stub; measure Web Vitals |
| 2   | Backend tracing             | 🟡   | TODO | OpenTelemetry spans across HTTP→service→DB; view a trace             |
| 3   | Structured logging + errors | 🟢   | TODO | a request-scoped `pino` logger + Sentry error capture                |
| 4   | Caching layer               | 🔴   | FS   | an in-memory LRU + TTL cache for a hot query — from scratch          |

**Done when:** Web Vitals improve after code-splitting · a request produces one linked trace · errors show in Sentry with context · the LRU evicts correctly and cuts DB hits.

### 28b — Debugging & Profiling (companion) ✅ implemented

The dedicated "how to find and fix it" toolbox, both ends. Concepts: **Chrome DevTools** (breakpoints/network/sources/coverage), **React DevTools Profiler** (find wasted renders), **Node `--inspect`** + VS Code/Chrome debugger, **flame graphs** (`clinic.js`/`0x`), **heap snapshots** for memory leaks, `EXPLAIN ANALYZE` + Prisma query logging, Next.js build/bundle analyzer, source maps, Lighthouse.

| #   | Task                     | Lane | Type | Build                                                                                            |
| --- | ------------------------ | ---- | ---- | ------------------------------------------------------------------------------------------------ |
| 1   | Debug a React render bug | 🟢   | WE   | solved DevTools-Profiler walkthrough + analog "find the wasted render" stub                      |
| 2   | Debug a Node service     | 🟡   | TODO | attach `--inspect`, set a breakpoint across HTTP→service→DB, fix a bug                           |
| 3   | Profile a slowdown       | 🟡   | TODO | flame-graph a hot path (`clinic`/`0x`); `EXPLAIN ANALYZE` a slow query; fix both                 |
| 4   | Hunt a memory leak       | 🔴   | FS   | reproduce a leak, take heap snapshots, find retainers; build a tiny `perf_hooks` timing profiler |

**Done when:** the wasted render is gone (Profiler confirms) · a breakpoint stops across the stack · the flame graph + `EXPLAIN` pinpoint the slow line · the leak's retaining path is identified and fixed.

### 28c — Microfrontends: Module Federation & Shell Orchestration (companion 🔴) ✅ implemented

Compose an app from independently-deployed remotes — the runtime under Webpack/Vite Module Federation, built from scratch. Concepts: host vs remote, `remoteEntry`/dynamic remote loading, **shared-scope singleton negotiation** (one React across remotes, semver-highest-wins), **shell/host orchestration** (mount/unmount lifecycle, error isolation), independent deployability, import maps as an alternative, when microfrontends are (and aren't) worth the cost.

| #   | Task                          | Lane | Type | Build                                                                              |
| --- | ----------------------------- | ---- | ---- | ---------------------------------------------------------------------------------- |
| 1   | Remote registry + loader      | 🔴   | FS   | a `loadRemote(name, module)` that dynamically imports, caches, and dedupes         |
| 2   | Shared-singleton negotiation  | 🔴   | FS   | a shared scope that returns one instance per dep, highest semver-satisfying wins   |
| 3   | Shell mount/unmount lifecycle | 🔴   | FS   | a host shell that mounts remotes into a container and tears them down with no leak |

**Done when:** two consumers of the same remote trigger one network load (dedupe + cache) · the shared scope hands every remote the same singleton, honoring a requested semver range · the shell mounts then unmounts a microfrontend with its listeners/instances fully released (no leak).

### 29 — Capstone Integration ✅ implemented

Finish both apps end-to-end with deliberately different stacks. Concepts: integrating everything; Kanban (Next RSC + Server Actions + Prisma + Auth.js + GraphQL) vs Chat (Vite + Nest REST/WS + JWT/Passport + raw SQL); shared packages; CI/deploy. Full specs (data models, API surface, milestones) in [`docs/CAPSTONES.md`](./docs/CAPSTONES.md).

| #   | Task                  | Lane | Type | Build                                                                |
| --- | --------------------- | ---- | ---- | -------------------------------------------------------------------- |
| 1   | Kanban vertical slice | 🟢   | EXT  | board CRUD + drag-move (optimistic) + Auth.js, on `packages/ui`+`db` |
| 2   | Chat vertical slice   | 🟡   | EXT  | rooms + realtime messages (`useSocket` + gateway) + JWT auth         |
| 3   | Cross-cutting         | 🟡   | EXT  | tests (trophy), CI, deploy, observability wired for both             |
| 4   | Ship & document       | 🟢   | TODO | READMEs + `/progress` reports both apps pass                         |

**Done when:** both apps deploy green with different auth stacks · realtime + optimistic UX work · `turbo run test` and `/progress` report both apps complete.

---

---

## Coverage matrix

### 5.1 Where each React hook is taught

| Hook                                          | Primary module(s) | From-scratch |
| --------------------------------------------- | ----------------- | ------------ |
| `useState`                                    | 05, 06            | 07b          |
| `useEffect`                                   | 05, 06            | 07b          |
| `useLayoutEffect`                             | 06                | —            |
| `useRef`                                      | 06, 07            | 07b          |
| `useReducer`                                  | 06                | —            |
| `useId`                                       | 06                | —            |
| `useContext`                                  | 07                | —            |
| `useMemo`                                     | 07                | 07b          |
| `useCallback`                                 | 07                | —            |
| `useImperativeHandle`                         | 07                | —            |
| `useTransition`                               | 10                | —            |
| `useDeferredValue`                            | 10                | —            |
| `useOptimistic`                               | 10, 25            | —            |
| `use()`                                       | 10, 25            | —            |
| `useSyncExternalStore`                        | 13, 14, 22        | 13b, 14b     |
| `useActionState`/`useFormStatus`              | 25                | —            |
| custom hooks                                  | 07                | 07b          |
| refs / portals (`createPortal`)               | 07                | —            |
| Suspense + error boundaries                   | 10, 23, 24        | —            |
| concurrent rendering                          | 10                | —            |
| patterns (compound/render-props/HOC/provider) | 08, 08b           | —            |
| performance / memoization                     | 07, 08, 28        | —            |
| React 19 (`use`/`useOptimistic`/Actions)      | 10, 25            | —            |

### 5.2 Requirement → module(s)

| Named requirement                                                     | Module(s)                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TypeScript for full-stack                                             | 01 (+ everywhere)                                                                 |
| Modern JS / async / event loop                                        | 02, 04                                                                            |
| Node fundamentals (streams, fs, http, EventEmitter)                   | 04                                                                                |
| HTTP / web basics                                                     | 03                                                                                |
| React core                                                            | 05                                                                                |
| ALL React hooks                                                       | 05, 06, 07, 10, 13, 14, 22, 25 (+ 07b) — see §5.1                                 |
| React patterns / performance                                          | 08, 08b, 28                                                                       |
| **CSS** (Flexbox, Grid, animations, responsive)                       | **05b**                                                                           |
| **Animation & motion** (transitions, FLIP, Framer Motion, VT API)     | **05c**                                                                           |
| **3D / WebGL** (Three.js, react-three-fiber, GLTF, GPU dispose)       | **10b**                                                                           |
| **Tailwind** + styling tradeoffs                                      | **11** (+ apps: Kanban Tailwind, Chat CSS Modules)                                |
| Forms (RHF, zod, TanStack Form)                                       | 09                                                                                |
| Suspense / error boundaries / concurrent / React 19                   | 10, 23, 24                                                                        |
| Component library + Storybook (a11y, `@storybook/test`)               | 11 (stories seeded in 05, 07, 08)                                                 |
| **Redux Toolkit** (slices/thunks/RTK Query/middleware)                | 12                                                                                |
| **Zustand** (+ external stores)                                       | 13 (+ 13b)                                                                        |
| **TanStack Query** (cache/optimistic/infinite/SSR hydration)          | 14 (+ 14b)                                                                        |
| TanStack ecosystem (Table/Router/Form)                                | 14, 09 (Form)                                                                     |
| Context vs external store; "when to use which"                        | 13                                                                                |
| Next.js core (App Router / RSC / routing / middleware)                | 23 (+ 23b)                                                                        |
| Next.js data/caching/streaming/SSR-SSG-ISR/SEO/image                  | 24 (+ 24b: PPR/parallel/intercepting)                                             |
| Server Actions                                                        | 25                                                                                |
| Node / Express                                                        | 17                                                                                |
| NestJS (DI/controllers/pipes/guards/interceptors/filters)             | 18                                                                                |
| **REST API design** (status/versioning/pagination/OpenAPI)            | 19                                                                                |
| **GraphQL — backend** (Nest code-first, DataLoader, subscriptions)    | 20 (+ 20b)                                                                        |
| **GraphQL — frontend** (Apollo/urql, codegen, normalized cache)       | 20                                                                                |
| **SQL + Postgres raw** (indexing, transactions, N+1, pooling)         | 15                                                                                |
| **Prisma** (schema/migrations/relations/tx/seeding)                   | 16                                                                                |
| **AUTH — multiple approaches compared**                               | 21 (+ 21b hand-rolled; Auth.js in 25)                                             |
| RBAC vs ABAC; CSRF/XSS/OWASP; argon2; zod                             | 21 (+ 21b)                                                                        |
| **TESTING — multiple approaches** (Vitest/RTL/e2e/Playwright/MSW/TDD) | 26 (`packages/testing`)                                                           |
| **REALTIME — WebSockets end-to-end** + SSE + subscriptions            | 22                                                                                |
| OPS — Docker + compose + GitHub Actions + Vercel/Railway/Fly          | 27                                                                                |
| Performance / observability                                           | 28                                                                                |
| **Debugging & profiling**                                             | **28b** (+ 28)                                                                    |
| Capstone / integration (two apps, different auth stacks)              | 29 + `apps/`                                                                      |
| From-scratch 🔴 deep-dives                                            | 02, 03, 04, 05b, 05c, 07b, 08, 08b, 10b, 13b, 14b, 15, 20b, 21b, 22, 23b, 28, 28c |
| Interactive learning (`/tutor`, `/exam`, `/progress`)                 | `.claude/` (cross-cutting)                                                        |
| Shared "core" packages                                                | `config`(00) `ui`(11) `db`(16) `auth`(21) `api-client`(19/20) `testing`(26)       |

**Totals:** 30 numbered modules (00–29) + 14 companions (05b, 05c, 07b, 08b, 10b, 11b,
13b, 14b, 20b, 21b, 23b, 24b, 28b, 28c) = **44 lessons**. Every named tech, every named React
hook, both capstones, and all cross-cutting topics (CSS/Tailwind, animation, 3D, auth,
TanStack, Storybook, testing, ops, realtime, debugging) are placed.

---
