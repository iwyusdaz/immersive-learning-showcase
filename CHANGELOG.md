# Changelog — immersive-learning-showcase

## 2.0.0 — 2026-10-29 (landing refresh for the v2 projects)
- Each card has its project's display font as the title (self-hosted latin woff2, OFL-1.1) and a coloured top border in the project's accent. Fonts are listed under "Landing page" on `/credits/`.
- Deployment log: the 2026-10-28 rollback test had left production auto-assignment off, so PRs #4–#6 never went live. Fixed with `vercel promote` on 2026-10-29. Pins are now verified on the production alias.

## 1.0.0 — 2026-10-27
- Initial showcase: landing page, credits, accessibility, 404, sitemap/robots.
- assemble.mjs with SHA-256 verification and path-traversal guard; check-dist.mjs size/absolute-path/required-files checks.
- vercel.json: strict CSP, immutable caching for fingerprinted assets and posters, content types for .ktx2/.glb, per-path Permissions-Policy (microphone=(self) only on /play/arrival-english/).
- Workflows: ci.yml, check-releases.yml (daily + manual, opens release-check PRs), post-deploy.yml (live header + smoke checks; opens a rollback-recommendation issue on failure).
- All seven projects start as "Coming soon" cards; pins are added in apps.json as each project releases.
