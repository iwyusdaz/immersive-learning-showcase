# Immersive Learning Showcase

One Vercel project that hosts all seven three.js learning projects plus this landing page.

**[Production URL](https://immersive-learning-showcase.vercel.app/)** (pending first deployment) · Each project plays at `/play/<slug>/` · Role: Sole designer

## What this repo does

Each of the seven project repos (`lunar-field-expedition`, `object-detective`, `field-ecologist`, `hazard-hunt`, `arrival-english`, `glacier-time-machine`, `first-session-tutor-sim`) publishes its built files as a GitHub Release asset (`<slug>-<version>.tar.gz` + `.sha256`). This repo pins versions in `apps.json`, downloads and verifies them at build time, and assembles one static site:

```
project repo tags v1.x → release archive + sha256
        ↓
showcase apps.json pins version + sha256
        ↓
Vercel build: assemble (verify) → landing/credits/accessibility/404/sitemap → check-dist
        ↓
Production: / and /play/<slug>/
```

## How to add or update a project

1. The project repo tags `vX.Y.Z`; its release workflow publishes the archive + checksum.
2. `check-releases.yml` (daily + manual) detects the new release, verifies the checksum against the published `.sha256`, updates `apps.json`, runs the full validation, sets the `validate` status, and opens a PR.
3. Merge the PR → Vercel deploys production. (Batch several releases into one PR when possible.)
4. Manual alternative: `node scripts/update-apps.mjs --check`, then `node scripts/update-apps.mjs --update <slug> <version> <sha256>` and open a PR yourself.

## How to roll back

- Fastest: Vercel instant rollback to the previous production deployment (dashboard).
- In git: revert the `apps.json` commit — the pinned previous version redeploys exactly.

## Build contract (what project repos must satisfy)

`08-vercel-deployment.md` section 5: Vite `base: './'`, no absolute asset paths, hash routing only, no service workers, slug-prefixed `localStorage`, self-hosted decoders, `showcase.json` + `attribution.json` + versioned poster at the build root, single file ≤ 20 MB, project build ≤ 150 MB target. Enforced by each repo's sub-path test and by `check-dist.mjs` here.

## Local development

```bash
npm ci
npm run build        # assemble + build-site + check-dist
npm run preview      # serve dist/ with vercel.json-equivalent headers
npm test             # landing + projects Playwright suites
BASE_URL=https://<production> npm run test:headers   # live checks
```

## Security and privacy

- Static files only: no functions, no environment variables, no secrets, no analytics, no cookies.
- Strict CSP; no third-party scripts/fonts/CDNs; all decoders self-hosted.
- Release integrity: pinned versions + SHA-256 verification + path-traversal guard.
- Workflows pinned to commit SHAs, least-privilege `permissions`, Dependabot for npm and Actions.

## Evaluation status

Automated functional, accessibility and performance testing plus agent-based design reviews are complete. No real learners have tested this yet. See each project's `evaluation/METHODS.md`.

## License and attribution

Landing page code: MIT (`LICENSE`). Landing page text: CC BY 4.0 (`LICENSE-CONTENT`). Each project keeps its own licenses and attribution (see `/credits/`).
