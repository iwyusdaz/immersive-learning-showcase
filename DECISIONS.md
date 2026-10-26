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

## Vercel limits (checked before first deployment)

Per Vercel's published limits (docs/limits, Hobby plan) as of 2026-10-27:
- **Max deployment size / individual file (static):** individual static asset limit ~100 MB per file is the historical guidance; our contract caps every file at **20 MB**, well inside any limit.
- **Fast Data Transfer:** 100 GB/month on Hobby.
- **Deployments:** ~100/day on Hobby (we batch release PRs).
- **Max build output:** Hobby allows large static deployments, but our whole-site budget is **≤ 1 GB** and per-project ≤ 150 MB target — inside limits.
- Conclusion: our budgets (20 MB/file, 150 MB/project, 1 GB/site) are stricter than Vercel's limits; no tightening needed.

**NOTE:** `vercel whoami` currently fails ("The specified token is not valid"), so the live limits page could not be re-fetched from an authenticated session; values above are from the public docs. Recorded as an owner task in OWNER-TASKS.md at `repos/immersive/OWNER-TASKS.md`.
