# Auth.js in the Kanban (Next) app — wiring artifact

Task 3 builds the OAuth/OIDC **flow logic** (`solution/03-oauth-oidc.ts`) so every security check —
PKCE, `state`, id-token `iss`/`aud`/`exp`/`nonce` — is unit-tested without a browser. In the real
Kanban app that logic is what **Auth.js** (NextAuth v5) performs for you at runtime. This file is the
**documented wiring**: it can't be unit-tested (it needs a live provider redirect + the Next request
runtime), so it ships as a reference you drop into `apps/kanban-web`.

Map each Auth.js piece back to the function you wrote:

| Auth.js does at runtime             | You built + tested in `03-oauth-oidc.ts`  |
| ----------------------------------- | ----------------------------------------- |
| generates `code_verifier`/challenge | `createPkcePair`                          |
| sets + checks the `state` cookie    | `verifyState`                             |
| POSTs the token endpoint            | `exchangeCode` (injected `TokenEndpoint`) |
| verifies the id_token via JWKS      | `verifyIdToken` (iss/aud/exp/nonce)       |

## `apps/kanban-web/auth.ts`

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Auth.js defaults to PKCE + state + nonce for OIDC providers — the exact checks
      // `createPkcePair` / `verifyState` / `verifyIdToken` implement by hand.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // Runs AFTER Auth.js has verified the id_token (sig + iss/aud/exp/nonce). Shape the session
    // the app sees — the same claims `verifyIdToken` returns.
    async jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub!;
      return session;
    },
  },
});
```

## `apps/kanban-web/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

## `apps/kanban-web/middleware.ts` (protect the board)

```ts
export { auth as middleware } from "@/auth";
export const config = { matcher: ["/board/:path*"] };
```

### Env

```bash
AUTH_SECRET=...            # openssl rand -base64 32
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

> Why this isn't a unit test: the authorization-code redirect requires a real browser round-trip to
> Google and Next's request/response runtime. The **decisions** inside that round-trip (PKCE, state,
> id-token verification) are the security surface — and those are fully covered by
> `test/03-oauth-oidc.test.ts`.
