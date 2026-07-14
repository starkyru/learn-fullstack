# @learn-fullstack/chat-web

The **Chat (Slack-lite)** capstone client — a **Vite React SPA**. This package is the **M0 validated
vertical slice**, not the finished app: one working Chat view (a room's message log + a composer)
wired to a reconnecting socket store and a Redux Toolkit slice.

## Stack

- **Vite SPA** — `index.html` + `src/main.tsx` entry, `vite.config.ts` (artifacts; the dev/build
  server is not part of the test gate).
- **Redux Toolkit** — `chatSlice.ts` holds channel / composer / message state. Components read it
  via `useChatState` (a `useSyncExternalStore` binding over the store — no `react-redux` dependency).
  **RTK Query** is the planned data layer for history/pagination (see M2 below).
- **`useSocket`** — `socket-store.ts` is the module-22 pattern: a reconnecting store on
  `useSyncExternalStore` over an **injected** socket factory + injected `Scheduler` (exponential
  backoff, capped). No real network or timers in the store — `main.tsx` injects the real
  `socket.io-client` adapter + a `window.setTimeout` scheduler; tests inject fakes.
- **CSS Modules** — `ChatView.module.css` scopes the view's styles.
- **Shared spine** — `@learn-fullstack/shared` supplies the `User` contract that `Author`/`Message`
  build on, so the client and the Chat API agree on one wire shape.

## The slice

`ChatView` renders the selected channel's messages and a composer. Inbound socket payloads flow
through the `messageReceived` reducer (deduped by id); sending appends **optimistically**
(`messageSent`, status `pending`) and emits on the socket — a later server echo flips the same id
to `sent`.

## Run

```bash
# Test gate (this is all CI checks):
pnpm --filter @learn-fullstack/chat-web exec tsc --noEmit
pnpm --filter @learn-fullstack/chat-web exec vitest run

# Dev server (Vite + its React plugin are installed; needs the Chat API on :3001):
pnpm --filter @learn-fullstack/chat-web dev
```

The tests run under **jsdom** with React Testing Library; every render (and its store subscription)
is torn down in `afterEach`. No Docker, no server, no DB required.

## Milestones (TODO)

M0 is an executable baseline, not a shipped client. Track M1–M6 production acceptance evidence in
[Module 29](../../modules/29-capstone/README.md) and the [capstone spec](../../docs/CAPSTONES.html).

- **M1 — Auth**: JWT/Passport login (Chat uses the JWT stack, not Auth.js); gate the socket
  connection on the token; presence.
- **M2 — History via RTK Query**: `createApi` endpoints for channels + paged message history;
  hydrate the log, then let the socket stream deltas on top.
- **M3 — Channels & membership**: channel list, join/leave, unread badges, `channelSwitched` wired
  to routing.
- **M4 — Rich messages**: edits/deletes, reactions, typing indicators, read receipts.
- **M5 — Resilience**: outbound queue while `status !== "open"`, retry/backoff surfaced in the UI,
  reconciliation of optimistic vs. confirmed messages.
- **M6 — Polish & deploy**: accessibility pass, virtualized message list, error/empty states, Docker
  image + CI.
