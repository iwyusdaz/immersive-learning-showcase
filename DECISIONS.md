# Decisions — immersive-learning-showcase

| # | Decision | Alternatives | Rationale | Date |
|---|---|---|---|---|
| 1 | Assemble release builds (plan 08 option D) | Seven Vercel projects; monorepo; rewrites | One project, separate case-study repos, pinned reproducible deploys, fast rollback | 2026-10-27 |
| 2 | `trailingSlash: true` everywhere | cleanUrls without trailing slash | Projects use relative asset paths that only resolve when the URL ends in `/` | 2026-10-27 |
| 3 | Checksum verification fails the build on mismatch | Warn only | A bad/partial download must never deploy (release integrity) | 2026-10-27 |
| 4 | Permissions-Policy rules hand-written in vercel.json with a CI cross-check planned | Generate from manifests | build-site.mjs warns when no manifest requests a permission; a CI check that the rules match manifests is listed as a follow-up in STATUS.md (the hand-written rules already implement the only special case: arrival-english microphone=(self)) | 2026-10-27 |
| 5 | Header test server implements vercel.json semantics in `serve-dist.mjs` | Skip header simulation | Lets CI test projects under the same CSP before production | 2026-10-27 |
| 6 | Lighthouse assertions ≥ 95 on the landing page only | Per-project Lighthouse | Plan 08 section 11 specifies the landing page; projects are covered by their own perf tests | 2026-10-27 |
| 7 | `check-releases.yml` re-runs full validation itself and sets the `validate` status | Rely on ci.yml | GITHUB_TOKEN PRs don't trigger other workflows; branch protection needs the status check | 2026-10-27 |
| 8 | Vercel limits recorded here before first deploy | Check after | Required by 08 5.5 | 2026-10-27 |
| 9 | Node major pinned to `24.x` in `engines` | `>=22` | Vercel picks the Node version from `engines`; `24.x` matches CI (actions/setup-node 24) and local Node v24.22.1 | 2026-10-27 |
| 10 | Vercel account and scope | — | `vercel whoami` → `iwyusd`, scope `iwyusds-projects` (personal, Hobby). Checked before any Vercel action; no existing `immersive-learning-showcase` project. | 2026-10-27 |

## Vercel limits (checked before first deployment)

Source: https://vercel.com/docs/limits (page last updated 2026-09-16), read on 2026-10-27. Hobby plan:
- Deployments created per day: **100** (also 100/hour and 60 per 5 minutes).
- Build time per deployment: **45 minutes**.
- Static file uploads via the CLI: **100 MB** of source files per deployment.
- Source files per CLI deployment: **15,000**. No hard limit on build output files.
- Concurrent deployments: **1**. Build disk: 32 GB.
- Fast Data Transfer: 100 GB/month (plan 08 section 12, Hobby allotment).

Effect on our budgets:
- The 100 MB CLI limit applies to *uploaded source*, not build output. The showcase source is small (well under 1 MB); release archives are downloaded during the Vercel build, so they don't count toward it. Budgets of 20 MB per file, 150 MB per project and 1 GB for the whole site stay as they are.
- With one concurrent build and 100 deployments/day, release pins are batched into one PR where possible.
