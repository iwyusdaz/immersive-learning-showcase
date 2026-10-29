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
| 11 | Deploy mode: **Git integration** | CLI mode (`vercel deploy --prod`) | `vercel link --yes --project immersive-learning-showcase` created the project and connected `iwyusdaz/immersive-learning-showcase`; `vercel git connect` confirmed it. Production branch `main`; PRs get Preview deployments behind Vercel Authentication (preview returned 302 to unauthenticated requests). | 2026-10-27 |
| 12 | Deleted the `.env.local` that `vercel link` wrote | Keep it | It holds a short-lived OIDC token the static site never uses. Deleted unread; `.env*` and `.vercel` are gitignored and excluded by `.vercelignore`. No environment variables are configured on the project. | 2026-10-27 |
| 13 | Site CSS copied by `build-site.mjs`; `check-dist.mjs` fails on any missing local reference | — | The first production deploy served `/styles/site.css` as a 404 page (the copy step only handled `scripts/`), so the live landing page was unstyled. Local tests missed it because they didn't check CSS. Now covered by a test and a build gate. | 2026-10-27 |

## Deployment log
- **dpl_aDCQqPgZCu9z2tMhvyXX3ENYL8T7** (Production, ref `vercel-setup` @ e588906): the first push after connecting Git deployed as Production before a Preview existed. Content was `main` plus ignore-file changes. Superseded below.
- **Preview** for PR #1 (`immersive-learning-showcase-2y0jguz4b-…`): build log clean (assemble, build-site, check-dist OK); unauthenticated request returned 302 (protected).
- **dpl_8RtwewBtop2yfN4E24gBMxnjarKA** (Production, `main` @ d445c85): after merging PR #1. Live checks: 10 passed, 1 skipped (asset content types need a live project). Lighthouse (live, 13.5.0): performance 100, accessibility 100, best practices 96, SEO 100. The best-practices console error came from the missing stylesheet (decision 13).

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

## Deployment log — v1.0.0 pin (2026-10-28)

- All seven projects released `v1.0.0` (each release job re-ran full CI, packed `dist/` and published `<slug>-1.0.0.tar.gz` + `.tar.gz.sha256`).
- PR #3 (`pin-v1-0-0`): pinned all seven in `apps.json` after verifying every archive against its published checksum; fixed `update-apps.mjs` `--update` argument parsing (read the slug from the mode position — would have broken `check-releases.yml`); the sub-path contract test now accepts object-detective's root-element text mode. CI + Vercel preview green; merged.
- Production after merge: landing 200; all seven `/play/<slug>/` 200.
- Live checks: `live-headers.spec.js` 3/3 with `BASE_URL` = production (the `.glb`/`.ktx2` content-type check, skipped pre-pin, now passes). Lighthouse (live landing, post-pin): performance 97, accessibility 100, best practices 100, SEO 100 — performance dropped from 100 because the cards now carry real posters/content.
- Per-project first-load transfer (production, no interaction): landing 279 KB; lunar 5260 KB; object-detective 2216 KB; field-ecologist 1686 KB; hazard-hunt 3250 KB; arrival-english 330 KB; glacier 1529 KB; tutor-sim 5967 KB (tool: `../_tools/live-transfer.mjs`; raw: `../_tools/live-transfer-2026-10-27.json`). All within the 15 MB budget.
- **Rollback test (plan §8):** with two production deployments live, `vercel rollback` to the pre-pin deployment moved the production alias within seconds (landing showed 7 "Coming soon" cards; `/play/lunar-field-expedition/` 404 as expected for that build). Rolling forward to the pinned deployment restored the full site (0 "Coming soon", all seven sub-paths 200). One transient `fetch failed` on the roll-forward command; an immediate retry succeeded.

## Deployment log — v2 pins (2026-10-28 to 2026-10-29)

- PRs #4 (hazard-hunt 2.0.0), #5 (arrival-english 2.0.0) and #6 (object-detective 2.0.0) merged with CI and previews green. Vercel built a **Production** deployment for each, but `immersive-learning-showcase.vercel.app` kept serving `dpl_5kBn8nkt…` (the 2026-10-28 v1.0.0 build). **Cause:** the rollback test above. After an instant rollback, Vercel stops auto-assigning production domains to new builds until a deployment is promoted, and the roll-forward was also a rollback. **Impact:** the three v2.0.0 releases were never live; they were superseded before anyone saw them.
- Found 2026-10-29 after PR #7 (lunar 2.0.0; hazard-hunt, object-detective, arrival-english 2.0.1, all sha256 verified). The build log showed the right releases downloaded and verified, but the alias still returned `"version": "1.0.0"`.
- **Fix:** `vercel promote` of the PR #7 production build (`dpl_J5KcVKrBgjgwGd7iX7JqrfErVCLn`, `main` @ 6513612). This re-enables auto-assignment. After promoting: all seven `/play/<slug>/` 200; versions lunar 2.0.0, hazard-hunt 2.0.1, object-detective 2.0.1, arrival-english 2.0.1, the other three 1.0.0; landing posters at the pinned versions. Live suite against production: `live-headers` + `landing` + `projects` 19 passed.
- **Rule from here:** a pin is done only when the production alias serves the pinned `showcase.json` versions, not when the PR merges. A rollback test ends with `vercel promote`, never a second rollback.
