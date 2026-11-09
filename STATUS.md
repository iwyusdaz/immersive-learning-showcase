# Status — immersive-learning-showcase

Last updated: 2026-11-09

| Item | Status |
|---|---|
| Repo, schemas, apps.json, site.config.json | done |
| Landing page (templates, CSS, copy, filters, credits, accessibility, 404) | done |
| assemble.mjs + checksum verification + path guard | done |
| check-dist.mjs (sizes, absolute-path scan, required files) | done |
| vercel.json (CSP, caching, content types, per-path Permissions-Policy) | done |
| ci.yml / check-releases.yml / post-deploy.yml | done |
| Branch protection + "allow GHA to create PRs" setting | done (gh api: `main` requires PR + `validate` status; Actions may create/approve PRs) |
| Local build + tests green | done (see results/) |
| GitHub CI (validate) green on main | done — run 40381675716 (includes assemble, axe, keyboard, 320px, Lighthouse ≥ 95, gitleaks) |
| First Vercel deployment | done — project `immersive-learning-showcase` (scope `iwyusds-projects`), Git integration, production from `main`. See DECISIONS.md "Deployment log". |
| Production URL in site.config.json + READMEs | done for showcase: `https://immersive-learning-showcase.vercel.app` (stable alias). Project READMEs get it as each one is written. |
| Live checks on production | 10 passed, 1 skipped (asset content types need a live project). Lighthouse live: 100 / 100 / 96 / 100. The 96 came from the missing stylesheet, fixed in PR #2; re-check after that deploy. |
| apps.json pins, v3.0.0 (five projects) | done — 2026-11-09: lunar-field-expedition, object-detective, hazard-hunt, field-ecologist and glacier-time-machine at 3.0.0, sha256 verified; arrival-english and first-session-tutor-sim removed (archived). Verified on the production alias (DECISIONS.md "Deployment log — v3.0.0") |
| apps.json pins, v2 (seven projects then) | superseded — 2026-10-29: lunar 2.0.0; hazard-hunt, object-detective, arrival-english 2.0.1; field-ecologist, glacier, tutor-sim 1.0.0 (their v2 releases follow). Verified on the production alias, not just in `apps.json` (see DECISIONS.md "Deployment log — v2 pins") |
| Rollback test | done 2026-10-28 (DECISIONS.md). It left production auto-assignment off until a `vercel promote` on 2026-10-29 |
| v3 preview (PR #11, draft, never merged) | 2026-11-09: closed, superseded by the v3.0.0 release PR |
| Known open issues at v3.0.0 | CI `validate` fails on the GitHub runner: object-detective's "Use text mode" button doesn't become clickable within 90 s under software WebGL (cause fixed in object-detective `main` 2026-11-10, T-33; clears once v3.0.1 is pinned). No light theme (the project accents fail contrast on white). |
| Release-check PR flow tested end to end | done for the v1 and v2 pins (PRs #3–#7) |

## Follow-ups noted in DECISIONS.md
- CI check that vercel.json Permissions-Policy rules match the manifests' `permissions`.
