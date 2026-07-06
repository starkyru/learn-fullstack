# Module 22b — Webhook Delivery (from scratch) 🔴 companion

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Build the outbound half of a B2B webhook platform — the part partners integrate against with
Stripe-level expectations. No SaaS SDK (no `svix`, no Stripe SDK, no `bullmq`): you hand-roll HMAC
signing, retry with exponential backoff, idempotent consumption, and a replay/DLQ engine, all over
**injected boundaries** (transport, clock, sleep) so every path is deterministic in a test. This is
the gap most B2B-API interviews probe and the course otherwise skips.

## Concepts

- **A signature binds the timestamp into the signed content.** Signing `${t}.${payload}` (not just
  `payload`) is what makes replay detectable: an attacker can't lift an old body under a fresh `t`
  without the secret. Verification is: recompute the HMAC, compare in **constant time**
  (`crypto.timingSafeEqual`, never `===` — `===` short-circuits and leaks byte positions via
  timing), then reject a timestamp outside a tolerance window.
- **Retry only transient failures, and back off.** A `429`/`5xx`/network error is worth retrying;
  a `4xx` is the partner rejecting the payload — retrying just burns attempts. Space retries with
  exponential backoff (`base * 2^(n-1)`) so a struggling partner isn't hammered. Inject `sleep` so
  the schedule is asserted, not waited on.
- **At-least-once ⇒ the consumer must be idempotent.** Delivery guarantees are at-least-once, so
  the same event id **will** arrive twice; dedupe against a persistent `seen` set. Events also
  arrive out of order — sort per endpoint by sequence and surface gaps (a missing seq = late/lost).
- **Delivery is a log, not a fire-and-forget.** Persist every attempt so you can **replay** a
  delivery by id and route exhausted ones to a **dead-letter queue**. That log is what turns "the
  webhook failed" into a debuggable, re-drivable event.

## Tasks

| #   | Task             | Lane | Type | Build                                                                                |
| --- | ---------------- | ---- | ---- | ------------------------------------------------------------------------------------ |
| 1   | Sign & verify    | 🟢   | WE   | solved HMAC `signWebhook` + analog `verifyWebhook` stub (constant-time, anti-replay) |
| 2   | Delivery & retry | 🟡   | TODO | `deliver` with exponential backoff; retry transient, stop on permanent 4xx           |
| 3   | Dedup & ordering | 🟡   | TODO | idempotency-key `dedupe` + per-endpoint ordering with gap detection                  |
| 4   | Replay & DLQ     | 🔴   | FS   | `replay` a delivery by id + a dead-letter queue — no `svix`/`bullmq`/Stripe SDK      |

## Theory & docs

This is a 🔴 from-scratch module — the primitives are the required reading; vendor docs are
reference-only, for comparing your contract afterwards.

- **Signing** — [HMAC (MDN / SubtleCrypto)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign),
  [`crypto.timingSafeEqual` (Node)](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b),
  [`crypto.createHmac` (Node)](https://nodejs.org/api/crypto.html#cryptocreatehmacalgorithm-key-options).
- **Retries & backoff** — [exponential backoff + jitter (AWS builders' library)](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).
- **Idempotency & delivery semantics** — [idempotency keys (Stripe)](https://docs.stripe.com/api/idempotent_requests),
  [at-least-once delivery (AWS SQS)](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html).
- After you've built it, compare your contract against the real thing:
  [Stripe webhook signatures](https://docs.stripe.com/webhooks/signatures) and
  [the Svix retry schedule](https://docs.svix.com/retries).

## Done when

- [ ] `signWebhook` emits `t=<ts>,v1=<hmac>`; `verifyWebhook` accepts a fresh untampered signature
      and rejects a tampered payload, wrong secret, stale timestamp, and malformed header.
- [ ] `deliver` retries only transient failures (network/429/5xx) with backoff `base * 2^(n-1)`,
      stops immediately on a permanent 4xx, and never sleeps after the final attempt.
- [ ] `dedupe` drops repeat ids across batches via a persistent `seen`; `orderPerEndpoint` sorts by
      seq per endpoint and reports the missing sequence numbers as gaps.
- [ ] `replay` re-drives a delivery by id, transitioning to `success`/`failed`/`dead`, and
      `deadLetters` returns exactly the exhausted deliveries; unknown id throws.

> **From scratch (FS):** `src/` throws `TODO` — implement each function. Tests import from
> `solution/`; run `pnpm grade 22b-webhook-delivery` (or flip a test's `../solution/x.js` to
> `../src/x.js`) to grade your own build.
