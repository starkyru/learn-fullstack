# Module 27b — Supply Chain Security & Safe Releases (companion)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT
> Take after Module 27. It turns CI from a quality gate into a trustworthy release boundary.

Production security includes the code you write, the code you install, and the automation that can
publish it. Pin or verify CI actions, review dependency changes, scan secrets before they leave the
machine, and treat an SBOM/audit/E2E/migration plan as release evidence rather than paperwork.

## Concepts

- **CI is privileged code** — a workflow can read repository secrets and publish artifacts. Pin
  third-party actions to reviewed immutable revisions and grant the smallest permissions needed.
- **Dependency hygiene** — lockfiles make resolution reproducible; audit findings need triage, not
  blind upgrades. Automated update PRs still need tests and human review.
- **Secret and artifact provenance** — scan before commit and CI, avoid logging secrets, emit an SBOM
  for a release, and record what commit/image was deployed.
- **Release gates** — a release requires behavior tests, browser/a11y checks, migration compatibility,
  security evidence, monitoring, and an explicit rollback plan.

## Tasks

| #   | Task                   | Lane | Type | What you build                                                                                                                    |
| --- | ---------------------- | ---- | ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Workflow-action review | 🟢   | WE   | solved immutable-action detector + analog allowlist validator                                                                     |
| 2   | Release evidence gate  | 🟡   | TODO | report the exact missing audit/SBOM/secret-scan/E2E/migration evidence                                                            |
| 3   | Harden CI              | 🔴   | FS   | add least-privilege permissions, dependency/secret scanning, SBOM generation, and a protected release workflow — no security SaaS |

## Done when

- [ ] An unpinned action reference is rejected and a 40-character SHA is accepted.
- [ ] The release gate names each missing artifact instead of returning a vague false.
- [ ] CI produces reviewable security/release evidence and the deploy workflow requires it before release.

> Tasks 1–2 are pure models of a workflow/release policy. Task 3 applies the policy to `.github/`.
> Tests import `solution/`; use `pnpm grade 27b-supply-chain-security` for your version.
