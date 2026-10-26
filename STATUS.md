# Status — immersive-learning-showcase

Last updated: 2026-10-27

| Item | Status |
|---|---|
| Repo, schemas, apps.json, site.config.json | done |
| Landing page (templates, CSS, copy, filters, credits, accessibility, 404) | done |
| assemble.mjs + checksum verification + path guard | done |
| check-dist.mjs (sizes, absolute-path scan, required files) | done |
| vercel.json (CSP, caching, content types, per-path Permissions-Policy) | done |
| ci.yml / check-releases.yml / post-deploy.yml | done |
| Branch protection + "allow GHA to create PRs" setting | pending (set via gh api after first CI runs; see below) |
| Local build + tests green | done (see results/) |
| First Vercel deployment | **blocked — `vercel whoami` fails: "The specified token is not valid"** (owner must re-authenticate; never run by the agent) |
| Production URL in site.config.json + READMEs | partially: expected URL written, marked pending deployment |
| apps.json pins (all 7 projects) | coming-soon; pins land as releases tag |
| Rollback test | pending (needs two production deployments) |
| Release-check PR flow tested end to end | pending (needs first project release) |

## Follow-ups noted in DECISIONS.md
- CI check that vercel.json Permissions-Policy rules match the manifests' `permissions`.
