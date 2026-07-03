---
name: jd-gap-analysis
description: >-
  Analyze a full-stack/web job description against the learn-fullstack curriculum and report
  coverage gaps. Given a JD (pasted text or a URL), extract the web/full-stack requirements
  (React/Next, Node/Nest, REST/GraphQL, SQL/Prisma, auth, realtime, state, testing, CI/CD,
  perf, TypeScript), map each against CURRICULUM.md + modules/*/README.md, and report a
  requirement→coverage table plus ranked gaps with a house-style module suggestion for each.
  Use when the learner shares a job posting and asks "am I ready", "what am I missing", or
  "does this course cover this role". Offers to fill the top gap via scaffold-module.
argument-hint: "<job description text or URL>"
---

You compare a **web/full-stack job description** against this course and report what is
covered, partially covered, or a gap. The learner provided:

> $ARGUMENTS

## Step 1 — Get the JD text

If `$ARGUMENTS` is a URL, fetch it (WebFetch). For a JS-heavy board that renders empty,
use the chrome-devtools MCP (`new_page` → `navigate_page` → `evaluate_script` to read
`document.body.innerText`). If it is pasted text, use it directly.

## Step 2 — Extract only the relevant requirements

Keep **web/full-stack** requirements: React/Next.js, Node/NestJS/Express, REST/GraphQL,
SQL/Postgres/Prisma/ORMs, auth (session/JWT/OAuth/Auth.js), realtime (WebSockets/SSE),
state (Redux/Zustand/TanStack Query), forms, styling/CSS/Tailwind, testing (Vitest/RTL/
Playwright/MSW), CI/CD/Docker/deploy, performance/observability, TypeScript. **Drop**
pure-ML/data-science, mobile-native, pure-SRE/infra-ops, and soft-skills lines. Normalize
each to a concept.

## Step 3 — Map against the curriculum

For each requirement, confirm depth with `rg -ri "<topic>" modules/*/README.md CURRICULUM.md`
and read the matching module section. Classify:

- **Covered** — a module teaches it directly (name it, e.g. `20 GraphQL end-to-end`).
- **Covered-equivalent** — taught via a sibling/approach (e.g. JD wants Apollo, course
  teaches TanStack Query + a GraphQL client; note the transfer).
- **Partial** — touched but shallow (name what's missing).
- **GAP** — not in the course.

The two capstones deliberately use **different auth stacks** (Auth.js/session for Kanban,
JWT/Passport for Chat) — cite that as evidence when a JD asks for "multiple auth strategies."

## Step 4 — Report

- A table: `| Requirement | Status | Where (module) |`.
- **Ranked gaps** — most-important-for-this-role first; for each, one house-style module
  suggestion (id/slug, depth lane, the 4-task shape, and which library a 🔴 would forbid).
- A one-line readiness verdict (e.g. "strong on React/Next + testing; gap on message queues").

## Step 5 — Offer to close the top gap

Offer to scaffold the highest-ranked gap as a new module via the **scaffold-module** skill.

## Rules

- Only web/full-stack requirements — do not invent coverage; a GAP is a GAP.
- Cite the module (or `rg` hit) for every "Covered"; name the missing piece for every
  "Partial". Rank by relevance to _this_ role, not by course order.
