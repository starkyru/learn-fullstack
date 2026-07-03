# Module 21b — From-Scratch Session Auth (Lucia-style) 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Hand-roll **secure** server sessions — no auth library. You generate high-entropy session ids,
store only a **hash** of each token at rest, verify with a **constant-time** compare, serialize a
hardened `Set-Cookie`, expire + **rotate** near the deadline, and defend unsafe requests with a
CSRF **double-submit** token plus an Origin/Referer allowlist. Finishing this makes a library like
`lucia` feel like something you already wrote — and, more importantly, teaches why each line is
there. This is security-sensitive: the solution is meant to be actually safe, not a toy.

## Concepts

- **Session-id entropy + hashing at rest** — the raw token is a `randomBytes(32)` value in
  base64url; the store only ever holds `sha256(token)`. Lookups hash the presented token and match
  that. A leaked store therefore reveals no usable credential — you can't reverse a SHA-256, and the
  raw token never touched disk.
- **Constant-time verification** — comparing secrets with `===` leaks how many leading bytes matched
  via timing. Every secret compare (token hash, cookie HMAC, CSRF token) goes through
  `crypto.timingSafeEqual` on equal-length buffers, guarding length first.
- **Expiry + rotation** — sessions carry an **idle** deadline (slides forward) and an **absolute**
  cap (fixed from creation). `validateSession` returns `null` past either. Near the idle deadline it
  **rotates**: mints a fresh token id, stores it, and deletes the old hash — so a stolen-but-stale
  cookie stops working the moment the real user refreshes.
- **CSRF: double-submit + origin** — the anti-CSRF token lives in a cookie _and_ is echoed in a
  header/body field; the server constant-time compares the two and independently checks the request
  `Origin`/`Referer` against an allowlist. An attacker's page can forge neither the header nor the
  origin.

## Tasks

| #   | Task                   | Lane | Type | What you build                                            |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------- |
| 1   | Session store + cookie | 🔴   | FS   | create/validate/rotate sessions; HttpOnly+SameSite cookie |
| 2   | CSRF protection        | 🔴   | FS   | double-submit token + origin check                        |
| 3   | Middleware guard       | 🔴   | FS   | a `requireSession` middleware for protected routes        |

## Theory & docs

- **Session store + cookie** —
  [MDN `Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie),
  [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
  [Node `crypto` docs](https://nodejs.org/api/crypto.html)
- **CSRF protection** —
  [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
  [MDN `Origin` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin),
  [MDN `Referer` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
- **Middleware guard** — [MDN `401 Unauthorized`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401),
  [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- Background: [MDN HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) — the
  `HttpOnly` / `Secure` / `SameSite` semantics the hardened cookie relies on.

## Done when

- [ ] A stolen cookie can't be forged: the store holds only `sha256(token)`, never the raw token, and
      `validateSession` uses a constant-time compare.
- [ ] Sessions expire (idle **and** absolute) and **rotate** near the deadline — the rotated-away
      token no longer validates.
- [ ] `serializeSessionCookie` emits `HttpOnly; Secure; SameSite=Lax; Path=/` with `Max-Age`/`Expires`
      from the session expiry.
- [ ] CSRF is rejected on a token mismatch **and** on a disallowed origin; accepted only when both the
      double-submit tokens match and the origin is allowlisted.
- [ ] `requireSession` throws `401` for a missing/invalid session, passes a valid one, and composes the
      CSRF check for unsafe methods.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; flip to `../src/...` to grade your own build. All randomness and the clock are
> **injected** (defaulting to `crypto.randomBytes` / `Date.now`) so tests stay deterministic.
