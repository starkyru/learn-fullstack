# Module 22c — File Uploads & Background Work (companion)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT
> Take after Module 22. It turns chat attachments and board exports into resilient production flows.

Files and slow work should not travel through a web process as an unbounded request. The app authorizes
metadata, gives the browser a short-lived object-store upload target, verifies the completed object, and
hands processing to an idempotent worker. The UI observes job state instead of waiting on a request.

## Concepts

- **Direct-to-object-storage uploads** — authorize the user and constrain content type/size before
  issuing a short-lived signed target. Persist object metadata only after completion is verified.
- **Untrusted bytes** — filenames, MIME headers, and file extensions lie. Enforce allowlists and size
  limits; scan before serving a public URL; never trust a client-provided object key.
- **At-least-once jobs** — queues may repeat delivery. Use an idempotency key, make each handler safe
  to retry, and record failure attempts before a dead-letter/review path.
- **Status is a product feature** — expose queued/running/failed/done states and a retry affordance;
  use a poll, SSE, or socket event depending on the existing transport.

## Tasks

| #   | Task                | Lane | Type | What you build                                                                                   |
| --- | ------------------- | ---- | ---- | ------------------------------------------------------------------------------------------------ |
| 1   | Upload policy       | 🟢   | WE   | solved image policy + analog attachment policy with size/MIME allowlists                         |
| 2   | Idempotent worker   | 🟡   | TODO | injected worker runner that processes each job key once and records attempts                     |
| 3   | Attachment pipeline | 🔴   | FS   | presign → upload → verify → scan → publish status for a capstone attachment, no upload/queue SDK |

## Done when

- [ ] The policy rejects an oversized or unsupported upload before a signed URL is issued.
- [ ] Re-delivering the same job key never runs the side effect twice and a failed attempt is observable.
- [ ] One capstone can attach a permitted file, show processing status, and keep failed objects private.

> The first two tasks use injected signing/worker boundaries so the test gate stays deterministic.
> Task 3 binds a real provider in an app composition root. Grade with `pnpm grade 22c-uploads-background-work`.
