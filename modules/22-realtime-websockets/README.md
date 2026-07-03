# Module 22 — Realtime: WebSockets End-to-End 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Build a realtime feature both ends of the wire. On the server, a NestJS **socket.io gateway** takes
connections, puts sockets into **rooms**, authenticates the socket, and **broadcasts**. In the
browser, a reconnecting **`useSocket`** client on `useSyncExternalStore` tracks connection status,
exposes the last message, and **backs off** on disconnect. Then you deliver the same feed two other
ways — **SSE** and a **GraphQL subscription** — and write the note on when to reach for each.

## Concepts

- **A gateway is a provider whose methods are wired to socket events.** `@WebSocketGateway()` marks
  the class; `@SubscribeMessage("join")` binds a handler; `@WebSocketServer()` injects the socket.io
  `Server` so a handler can broadcast beyond the socket that fired it (`server.to(room).emit`).
  Returning a value from a handler sends it back to the caller as the event's ACK. Rooms are just
  server-side sets: `client.join(room)` opts a socket in; broadcasts target a room, not a list of ids.
- **The browser client is an external store with a reconnect policy.** The store is a closure over
  `{ status, lastMessage }` + a `Set` of listeners — the exact `subscribe`/`getSnapshot` contract
  `useSyncExternalStore` consumes. It talks to a `Socket` INTERFACE (not socket.io directly) and
  schedules reconnects through an INJECTED clock, so on `close` it retries with **exponential
  backoff** (`min(base · 2ⁿ, max)` → 100, 200, 400, … capped) and a clean open resets the ladder.
  Injecting the socket factory + scheduler is what makes it testable with no network and no timers.
- **Auth happens on the connection, and the server owns identity.** The gateway reads the handshake
  token on connect, resolves it to a user id (rejecting — `unauthorized` + `disconnect` — when it
  can't), and stamps that id onto `socket.data`. Broadcasts use the SERVER-verified `from`, never a
  client-supplied one.
- **WebSocket isn't the only realtime transport.** **SSE** is one-way server→client over plain HTTP
  (great for push-only feeds; rides existing auth/proxies; auto-reconnects). **GraphQL
  subscriptions** are a typed push channel (usually over a WebSocket) that shares schema/tooling with
  your queries. Pick by direction and stack, not by habit.

## Tasks

| #   | Task                   | Lane | Type | What you build                                                                     |
| --- | ---------------------- | ---- | ---- | ---------------------------------------------------------------------------------- |
| 1   | Nest WS gateway        | 🟢   | WE   | solved ChatGateway (join room, broadcast) + analog PresenceGateway stub            |
| 2   | `useSocket` client     | 🔴   | FS   | a reconnecting useSocket on useSyncExternalStore (backoff, subscribe)              |
| 3   | End-to-end round trip  | 🟡   | TODO | client emits → gateway → broadcast → other clients update; authenticate the socket |
| 4   | SSE & GraphQL-subs alt | 🟢   | EXT  | same feed via SSE and via a GraphQL subscription; write the tradeoff note          |

## Theory & docs

- **Nest WS gateway** — [NestJS gateways](https://docs.nestjs.com/websockets/gateways),
  [Socket.IO rooms](https://socket.io/docs/v4/rooms/)
- **`useSocket` client** —
  [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API),
  [react.dev `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- **End-to-end round trip** — [Socket.IO middlewares](https://socket.io/docs/v4/middlewares/)
  (handshake auth), [RFC 6455 — The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
- **SSE & GraphQL-subs alt** —
  [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events),
  [GraphQL subscriptions](https://graphql.org/learn/subscriptions/)
- Background: [MDN `WebSocket` interface](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
  — the native socket the transports above are built on.

## Done when

- [ ] Two clients that `join` the same room see each other's `message` broadcasts in realtime with
      the exact payload; a client in a different room is not reached.
- [ ] `useSocket` reports `connecting → open`, updates `lastMessage` and notifies on each message,
      and on socket close reconnects with backoff delays `100, 200, 400, …` capped at `max` (driven
      by an injected clock); unmounting unsubscribes the listener (no leak).
- [ ] The auth gateway disconnects a socket with a missing/invalid token (`unauthorized` event) and
      accepts a valid one, then completes a two-client round trip stamping the server-verified sender.
- [ ] The SSE endpoint streams the same feed as parseable `text/event-stream` frames and the
      GraphQL-subscription iterator yields the same events; `REALTIME_TRADEOFFS` compares all three.

## Toolchain note (why SWC + a per-file jsdom opt-in)

The gateways use **decorator metadata** (`design:paramtypes`, emitted by `emitDecoratorMetadata`),
which vitest's default esbuild transform does **not** emit — so this module transforms tests through
**SWC** (`unplugin-swc`) with legacy decorators + metadata, and `test/setup.ts` imports
`reflect-metadata` first. The default vitest `environment` is **node** (server/socket tests need it);
the React CLIENT test (`02-use-socket.test.tsx`) opts into a browser DOM with a
`// @vitest-environment jsdom` **first line**. Server/socket tests connect real `socket.io-client`s
to an app on an ephemeral port (`listen(0)`) and close every client + app in `afterEach` (no leaked
handles); the client test injects a fake socket + fake clock (no real network, no real timers).

> **Worked example (WE):** `ChatGateway` is solved in **both** `src/` and `solution/`; the analog
> `PresenceGateway` throws `TODO` in `src/` — mirror `Chat*`. **TODO:** `src/03` throws; keep the
> signatures, implement the bodies. **From scratch (FS):** `src/02` throws — build the store + hook.
> **Extend (EXT):** `src/04` mirrors `solution/04`. Tests import from `solution/`; point them at
> `../src/...` to grade your own build.
