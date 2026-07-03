import { generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  buildAuthUrl,
  createPkcePair,
  exchangeCode,
  verifyIdToken,
  verifyState,
  type Clock,
  type Entropy,
  type TokenResponse,
} from "../solution/03-oauth-oidc.js";

/** Deterministic entropy: hands back a fixed byte pattern so verifier/challenge are reproducible. */
function fixedEntropy(fill: number): Entropy {
  return { random: (n) => new Uint8Array(n).fill(fill) };
}

const clockAt = (ms: number): Clock => ({ now: () => ms });

describe("Task 3 — OAuth/OIDC + PKCE", () => {
  describe("PKCE", () => {
    it("derives the S256 challenge as base64url(sha256(verifier))", () => {
      // 32 zero bytes → verifier is 43 'A's; challenge independently computed with Python/openssl.
      const pair = createPkcePair(fixedEntropy(0));
      expect(pair.method).toBe("S256");
      expect(pair.verifier).toBe("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      expect(pair.challenge).toBe("DwBzhbb51LfusnSGBa_hqYSgo7-j8BTQnip4TOnlzRo");
    });
  });

  describe("authorization URL", () => {
    it("carries the PKCE challenge, state, and nonce", () => {
      const url = buildAuthUrl(
        {
          authorizationEndpoint: "https://idp.example.com/authorize",
          clientId: "kanban-web",
          redirectUri: "https://kanban.app/callback",
          scope: "openid email profile",
        },
        { state: "st-1", nonce: "no-1", challenge: "CH" },
      );
      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe("https://idp.example.com/authorize");
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("client_id")).toBe("kanban-web");
      expect(parsed.searchParams.get("redirect_uri")).toBe("https://kanban.app/callback");
      expect(parsed.searchParams.get("scope")).toBe("openid email profile");
      expect(parsed.searchParams.get("state")).toBe("st-1");
      expect(parsed.searchParams.get("nonce")).toBe("no-1");
      expect(parsed.searchParams.get("code_challenge")).toBe("CH");
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    });
  });

  describe("state validation (callback CSRF)", () => {
    it("accepts a matching state and rejects a forged one", () => {
      expect(verifyState("abc123", "abc123")).toBe(true);
      expect(verifyState("abc123", "abc124")).toBe(false);
      expect(verifyState("abc123", "abc1230")).toBe(false);
    });

    it("exchangeCode refuses to hit the network on a bad state", async () => {
      let called = false;
      const endpoint = async (): Promise<TokenResponse> => {
        called = true;
        return { id_token: "x", access_token: "y" };
      };
      await expect(
        exchangeCode(endpoint, {
          code: "AUTH_CODE",
          verifier: "V",
          expectedState: "good",
          receivedState: "evil",
          redirectUri: "https://kanban.app/callback",
          clientId: "kanban-web",
        }),
      ).rejects.toThrow(/state/i);
      expect(called).toBe(false);
    });

    it("exchangeCode forwards code + verifier to the endpoint on a good state", async () => {
      let seen: Record<string, string> | undefined;
      const endpoint = async (body: Record<string, string>): Promise<TokenResponse> => {
        seen = body;
        return { id_token: "ID", access_token: "AT" };
      };
      const tokens = await exchangeCode(endpoint, {
        code: "AUTH_CODE",
        verifier: "VERIFIER",
        expectedState: "st",
        receivedState: "st",
        redirectUri: "https://kanban.app/callback",
        clientId: "kanban-web",
      });
      expect(tokens).toEqual({ id_token: "ID", access_token: "AT" });
      expect(seen).toMatchObject({
        grant_type: "authorization_code",
        code: "AUTH_CODE",
        code_verifier: "VERIFIER",
      });
    });
  });

  describe("id_token verification", () => {
    const ISS = "https://idp.example.com";
    const AUD = "kanban-web";
    const NONCE = "nonce-xyz";
    const NOW = 1_700_000_000_000; // ms

    type KeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

    async function keys(): Promise<KeyPair> {
      return generateKeyPair("RS256");
    }

    function baseToken(
      privateKey: KeyPair["privateKey"],
      over: Record<string, unknown> = {},
    ) {
      const iat = Math.floor(NOW / 1000);
      return new SignJWT({
        nonce: NONCE,
        email: "ada@example.com",
        name: "Ada",
        iat,
        exp: iat + 3600,
        ...over,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject("google|123")
        .setIssuer(ISS)
        .setAudience(AUD)
        .sign(privateKey);
    }

    it("returns the user claims for a valid token", async () => {
      const { publicKey, privateKey } = await keys();
      const token = await baseToken(privateKey);
      const claims = await verifyIdToken(token, {
        key: publicKey,
        issuer: ISS,
        audience: AUD,
        nonce: NONCE,
        clock: clockAt(NOW),
      });
      expect(claims).toEqual({
        sub: "google|123",
        email: "ada@example.com",
        name: "Ada",
      });
    });

    it("rejects a tampered token (signature no longer matches)", async () => {
      const { publicKey, privateKey } = await keys();
      const token = await baseToken(privateKey);
      const tampered = token.slice(0, -3) + (token.endsWith("AAA") ? "BBB" : "AAA");
      await expect(
        verifyIdToken(tampered, {
          key: publicKey,
          issuer: ISS,
          audience: AUD,
          nonce: NONCE,
          clock: clockAt(NOW),
        }),
      ).rejects.toThrow();
    });

    it("rejects an id_token from the wrong issuer (valid signature, correct aud + nonce)", async () => {
      const { publicKey, privateKey } = await keys();
      const iat = Math.floor(NOW / 1000);
      // A validly-signed token whose ONLY defect is a different `iss` — everything the
      // relying party otherwise trusts (aud, nonce, exp, signature) is correct.
      const token = await new SignJWT({
        nonce: NONCE,
        email: "ada@example.com",
        name: "Ada",
        iat,
        exp: iat + 3600,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject("google|123")
        .setIssuer("https://evil-idp.example.com")
        .setAudience(AUD)
        .sign(privateKey);
      await expect(
        verifyIdToken(token, {
          key: publicKey,
          issuer: ISS,
          audience: AUD,
          nonce: NONCE,
          clock: clockAt(NOW),
        }),
      ).rejects.toThrow(/iss/i);
    });

    it("rejects a wrong audience", async () => {
      const { publicKey, privateKey } = await keys();
      const token = await baseToken(privateKey);
      await expect(
        verifyIdToken(token, {
          key: publicKey,
          issuer: ISS,
          audience: "some-other-app",
          nonce: NONCE,
          clock: clockAt(NOW),
        }),
      ).rejects.toThrow();
    });

    it("rejects a mismatched nonce (replay)", async () => {
      const { publicKey, privateKey } = await keys();
      const token = await baseToken(privateKey, { nonce: "attacker-nonce" });
      await expect(
        verifyIdToken(token, {
          key: publicKey,
          issuer: ISS,
          audience: AUD,
          nonce: NONCE,
          clock: clockAt(NOW),
        }),
      ).rejects.toThrow(/nonce/i);
    });

    it("rejects an expired token by the injected clock", async () => {
      const { publicKey, privateKey } = await keys();
      const token = await baseToken(privateKey);
      await expect(
        verifyIdToken(token, {
          key: publicKey,
          issuer: ISS,
          audience: AUD,
          nonce: NONCE,
          clock: clockAt(NOW + 3601 * 1000),
        }),
      ).rejects.toThrow();
    });
  });
});
