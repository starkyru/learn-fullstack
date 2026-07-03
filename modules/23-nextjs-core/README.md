# Module 23 — Next.js Core (App Router & RSC)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Next.js 15's App Router with React 19: layouts that wrap route segments, **React Server
Components** that render on the server with zero client JS, the thin `"use client"` islands
that add interactivity, web-standard **route handlers** (`Request → Response`), **middleware**
that gates requests before they hit a route, and the `loading.tsx` / `error.tsx` convention
files that drive Suspense and error UI.

The Next runtime can't be unit-tested directly, so everything here is written as **plain,
extracted logic**: layouts are `async` functions returning an element tree (await + inspect),
route handlers take a real `Request` and return a real `Response`, middleware takes a
NextRequest-like object and returns a redirect `Response`. No dev server required.

## Concepts

- **Layouts are async RSC that wrap `children`** — a layout is just `async ({ children }) =>
<shell>{children}</shell>`. It renders on the server and never re-mounts across navigations
  within its segment. Awaiting it returns the element tree, so its structure is directly
  assertable.
- **Server by default, client on demand** — a Server Component renders to HTML with no handlers
  shipped to the browser. Interactivity lives in a small `"use client"` leaf (`<AddCardButton>`)
  that the server tree simply _includes_ as an element. The server part carries no `onClick`.
- **Route handlers are the platform** — `export async function GET(req: Request): Promise<Response>`
  (and `POST`) are web-standard. Validate the body with `zod`, return `Response.json`-style
  payloads with exact status codes (`200`, `201`, `400`).
- **Middleware redirects before the route runs** — read the session cookie; if it's missing,
  return a `307` redirect to `/login` (`NextResponse.redirect` is a `307`). Otherwise return
  `undefined` to let the request through.
- **`loading.tsx` / `error.tsx`** — Next wraps a segment in `<Suspense fallback={<Loading/>}>`
  and an error boundary automatically; `error.tsx` is a client component that receives
  `{ error, reset }`. Here you build the pieces and the Suspense boundary demo by hand.

## Tasks

| #   | Task                        | Lane | Type | What you build                                             |
| --- | --------------------------- | ---- | ---- | ---------------------------------------------------------- |
| 1   | Routes & layouts            | 🟢   | WE   | solved board layout + analog card-detail route stub        |
| 2   | Server vs client components | 🟡   | TODO | server-render the board; make only interactive bits client |
| 3   | Route handlers + middleware | 🟢   | TODO | a route-handler API + auth middleware redirect             |
| 4   | Loading/error UI            | 🟢   | EXT  | add loading.tsx/error.tsx with Suspense boundaries         |

## Done when

- [ ] `RootLayout` / `BoardLayout` await to the expected wrapper tree (html/body/main and
      board nav + content section), passing `children` straight through; the analog
      `CardDetailLayout` wraps children with a back-link and an `<article>`.
- [ ] `BoardView` renders the board as an RSC — column titles and cards as static host
      elements with **no** `onClick` — and delegates interactivity to the `"use client"`
      `<AddCardButton>`, which toggles between "Add card" and its inline form.
- [ ] `GET /api/cards` returns `200` with the card list; `POST` validates with `zod`
      (`400` on bad input) and returns `201` with the created card (id injected, not random);
      `middleware` returns a `307` to `/login` for a request with no `session` cookie.
- [ ] `Loading` shows a status fallback, `ErrorState` shows the message and a working
      `reset` button, and `SuspendingBoard` shows the fallback then the resolved content.

> **Worked example (WE):** `src/` shows a solved reference plus an analog stub you complete.
> **TODO:** `src/` throws — implement it. **EXT:** `src/` already mirrors the solution.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
