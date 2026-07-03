# Module 21 — Authentication & Security 🔴

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Compare the four ways the two apps authenticate — and then attack yourself. The chat app (Nest REST)
uses **JWT access + refresh** behind **Passport-style guards**; the Kanban app (Next) uses **social
login via Auth.js**. Under both sits the oldest pattern — a **salted password + server session** —
and over both sits the same threat model — **OWASP**: XSS steals tokens, CSRF rides sessions. Each
approach is a different point on the _stateless ↔ server-state_ and _first-party ↔ delegated_ axes;
you build the security-critical **logic** of each one testably, mocking only true boundaries (a
provider's token endpoint, a CSPRNG, the clock).

## Concepts

- **A password is a slow, salted hash; a session is server state.** Never store a raw password —
  store a bcrypt/argon2 digest with a per-password salt and a work factor that keeps brute force
  slow, and compare in constant time. A "logged-in" browser holds only an **opaque session id**; all
  trust lives server-side, so `logout`/`rotate` revoke instantly. The alternative — **JWTs** — moves
  that trust _into_ a signed token: nothing to look up, but nothing to revoke either, which is why
  access tokens are **short-lived** and refresh tokens **rotate** with **reuse detection** (a
  replayed refresh burns the whole family).
- **Delegated login is a verification problem, not a redirect problem.** OAuth/OIDC's browser dance
  (authorization-code + **PKCE** + **state** + **nonce**) exists so the code you receive can't be
  stolen (PKCE), the callback can't be forged (state), and the id_token can't be replayed (nonce).
  Auth.js runs the dance; the security is the **checks** — verify the id_token's signature via JWKS
  and its `iss`/`aud`/`exp`/`nonce`. Build those checks and the library is just ergonomics.
- **Framework guards are just `verify → attach → authorize`.** A Nest `CanActivate` that verifies a
  bearer JWT and hydrates `req.user` is exactly a Passport `JwtStrategy.validate()`; an RBAC guard is
  a `Reflector` read (`@Roles('admin')`) plus a set-membership check. And every session is only as
  safe as the app's output: **escape** user content (stored XSS) and demand a **double-submit token +
  Origin match** on writes (CSRF), or the auth above is moot.

## Tasks

| #   | Task                   | Lane | Type | What you build                                                        |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------------------- |
| 1   | Password + sessions    | 🟢   | WE   | solved argon2 hash + server-session login + analog logout/rotate stub |
| 2   | JWT access+refresh     | 🟡   | TODO | short access + rotating refresh (reuse detection) for the chat app    |
| 3   | OAuth/OIDC + Auth.js   | 🟢   | TODO | social login via Auth.js in the Kanban (Next) app                     |
| 4   | Passport + Nest guards | 🟡   | TODO | a JWT strategy + an RBAC guard on chat's Nest API                     |
| 5   | OWASP hardening        | 🔴   | FS   | exploit then fix CSRF + stored XSS; add CSRF tokens + escaping        |

## Theory & docs

- **Password + sessions** —
  [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
  [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- **JWT access+refresh** — [RFC 7519 (JSON Web Token)](https://datatracker.ietf.org/doc/html/rfc7519),
  [jwt.io introduction](https://jwt.io/introduction)
- **OAuth/OIDC + Auth.js** — [Auth.js docs](https://authjs.dev),
  [RFC 7636 (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- **Passport + Nest guards** — [Passport docs](https://www.passportjs.org/docs/),
  [NestJS guards](https://docs.nestjs.com/guards),
  [NestJS passport recipe](https://docs.nestjs.com/recipes/passport)
- **OWASP hardening** —
  [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
  [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- Background: [MDN HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies),
  [MDN `Authorization` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization),
  [OWASP Cheat Sheet Series index](https://cheatsheetseries.owasp.org/)

## Done when

- [ ] A wrong password fails and a correct one succeeds; the stored hash `!==` the raw password and
      `verifyPassword` accepts only the right one. `login` mints a server session from the injected
      id + clock; the analog `logout`/`rotateSession` revoke and re-issue.
- [ ] An access token verifies and **expires** by the injected clock; refresh **rotation**
      invalidates the old token; replaying an already-rotated refresh triggers **reuse detection**
      and **revokes the family**.
- [ ] The OAuth flow rejects a **tampered id_token**, a **bad state**, a **wrong nonce**, and an
      **expired** token, and a valid flow yields the user claims; PKCE `challenge ===
base64url(sha256(verifier))`. The Auth.js Next config ships as `docs/authjs-config.md`.
- [ ] The Nest guards answer **401** with no/invalid/expired token, **403** for a valid non-admin on
      an `@Roles('admin')` route, and **200** for an admin.
- [ ] The stored-XSS payload is dangerous **before** (`renderCommentUnsafe`) and neutralized to
      entities **after** (`escapeHtml`/`renderCommentSafe`); a forged cross-site POST is **rejected**
      by the double-submit + Origin check while a genuine request passes.

## Toolchain note (why SWC, not plain vitest)

Task 4 wires a **real Nest module**, whose DI reads **decorator metadata** (`design:paramtypes`,
emitted by `emitDecoratorMetadata`). vitest's default esbuild transform doesn't emit it, so this
module transforms tests through **SWC** (`unplugin-swc`) with legacy decorators + metadata, and
`test/setup.ts` imports `reflect-metadata` first — the plain jose/bcrypt/OWASP tasks pass through
SWC unchanged. `tsconfig.json` sets `experimentalDecorators`, `emitDecoratorMetadata`,
`useDefineForClassFields: false`, and `verbatimModuleSyntax: false` (it conflicts with metadata emit).

## Testability doctrine

The real security logic is extracted and unit-tested; only true external boundaries are mocked —
the OAuth **token endpoint** (an injected `fetch`-shaped fn), the **CSPRNG** (an injected `Entropy`),
and the **clock**. Nothing asserts a mocked value back. The two pieces that genuinely need a live
runtime — the OAuth redirect and Auth.js itself — ship as the documented `docs/authjs-config.md`
artifact, with their security-critical decisions (PKCE, state, id-token verification) fully covered
by `test/03-oauth-oidc.test.ts`.

> **Worked example (WE):** task 1's hash/verify/login is solved in **both** `src/` and `solution/`;
> the analog `logout`/`rotateSession` throws `TODO` in `src/` — implement it. **TODO** tasks throw in
> `src/`; keep the signature and shape, implement the body. **From scratch (FS):** task 5's fixes
> throw in `src/` — build them (the vulnerability `renderCommentUnsafe` is left intact so you can
> prove the exploit). Tests import from `solution/`; point them at `../src/...` to grade your build.
