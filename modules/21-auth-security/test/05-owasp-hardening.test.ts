import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  renderCommentSafe,
  renderCommentUnsafe,
  verifyCsrf,
  type CsrfRequest,
} from "../solution/05-owasp-hardening.js";

const APP_ORIGIN = "https://chat.app";
const XSS = `<script>alert("x")&'/`;

describe("Task 5 — OWASP hardening", () => {
  describe("stored XSS", () => {
    it("EXPLOIT (before): the unsafe renderer emits a live <script> tag", () => {
      const out = renderCommentUnsafe(XSS);
      expect(out).toContain("<script>alert(");
      expect(out).toBe(`<div class="comment"><script>alert("x")&'/</div>`);
    });

    it("escapeHtml neutralizes every HTML-significant character", () => {
      // Hand-written expected — each char maps to its entity, `&` escaped first.
      expect(escapeHtml(XSS)).toBe("&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;&#x2F;");
    });

    it("FIX (after): the safe renderer emits inert, escaped text — no live tag", () => {
      const out = renderCommentSafe(XSS);
      expect(out).toContain("&lt;script&gt;");
      expect(out).not.toContain("<script>");
      expect(out).toBe(
        `<div class="comment">&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;&#x2F;</div>`,
      );
    });
  });

  describe("CSRF (double-submit + origin)", () => {
    const legit: CsrfRequest = {
      method: "POST",
      originHeader: APP_ORIGIN,
      cookieToken: "tok-abc",
      headerToken: "tok-abc",
    };

    it("accepts a genuine same-origin request whose header matches the cookie", () => {
      expect(verifyCsrf(legit, APP_ORIGIN)).toBe(true);
    });

    it("EXPLOIT: rejects a forged cross-site POST (attacker origin, no header token)", () => {
      const forged: CsrfRequest = {
        method: "POST",
        originHeader: "https://evil.example",
        cookieToken: "tok-abc", // cookie rides along automatically...
        headerToken: undefined, // ...but the attacker can't read/set the header token
      };
      expect(verifyCsrf(forged, APP_ORIGIN)).toBe(false);
    });

    it("rejects a same-origin POST when the header token is absent (and does not crash)", () => {
      // Origin is correct and the cookie rode along, but the `X-CSRF-Token` header is missing.
      // The presence guard must reject BEFORE the constant-time compare touches `undefined.length`.
      const req: CsrfRequest = {
        method: "POST",
        originHeader: APP_ORIGIN,
        cookieToken: "tok-abc",
        headerToken: undefined,
      };
      expect(verifyCsrf(req, APP_ORIGIN)).toBe(false);
    });

    it("rejects a same-origin request whose header token does not match the cookie", () => {
      expect(verifyCsrf({ ...legit, headerToken: "tok-xyz" }, APP_ORIGIN)).toBe(false);
    });

    it("rejects a matching token when the Origin is wrong", () => {
      expect(
        verifyCsrf({ ...legit, originHeader: "https://evil.example" }, APP_ORIGIN),
      ).toBe(false);
    });

    it("allows a safe GET regardless of tokens", () => {
      expect(
        verifyCsrf(
          {
            method: "GET",
            originHeader: undefined,
            cookieToken: undefined,
            headerToken: undefined,
          },
          APP_ORIGIN,
        ),
      ).toBe(true);
    });
  });
});
