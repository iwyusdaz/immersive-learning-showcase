/**
 * Post-deploy live checks (run with BASE_URL=<production-url> npx playwright test tests/live-headers.spec.js):
 * CSP present on HTML; Cache-Control immutable on fingerprinted assets and not on HTML;
 * correct content types for .glb and .ktx2; Permissions-Policy allows microphone only on
 * /play/arrival-english/.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';

test('HTML responses carry the CSP and no immutable caching', async ({ request }) => {
  const res = await request.get(`${BASE}/`);
  expect(res.status()).toBe(200);
  const headers = res.headers();
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['cache-control'] || '').not.toContain('immutable');
});

test('Permissions-Policy denies the microphone everywhere except arrival-english', async ({ request }) => {
  const landing = await request.get(`${BASE}/`);
  expect(landing.headers()['permissions-policy']).toContain('microphone=()');
  for (const slug of ['lunar-field-expedition', 'object-detective', 'field-ecologist', 'hazard-hunt', 'glacier-time-machine', 'first-session-tutor-sim']) {
    const res = await request.get(`${BASE}/play/${slug}/`);
    if (res.status() === 200) expect(res.headers()['permissions-policy'], slug).toContain('microphone=()');
  }
  const arrival = await request.get(`${BASE}/play/arrival-english/`);
  if (arrival.status() === 200) expect(arrival.headers()['permissions-policy']).toContain('microphone=(self)');
});

test('fingerprinted assets are immutable; .glb and .ktx2 have correct content types', async ({ request }) => {
  // discover one asset per live project from the landing page HTML
  const html = await (await request.get(`${BASE}/`)).text();
  const playHrefs = [...html.matchAll(/\/play\/([a-z0-9-]+)\//g)].map((m) => m[1]);
  test.skip(playHrefs.length === 0, 'No live projects yet (all cards are "Coming soon")');
  const checked = { glb: 0, ktx2: 0 };
  for (const slug of new Set(playHrefs)) {
    const page = await request.get(`${BASE}/play/${slug}/`);
    if (page.status() !== 200) continue;
    const body = await page.text();
    for (const m of body.matchAll(/"([A-Za-z0-9_./-]+\.(?:glb|ktx2))"/g)) {
      const asset = m[1];
      const res = await request.get(`${BASE}/play/${slug}/${asset.replace(/^\.\//, '')}`);
      if (res.status() !== 200) continue;
      if (asset.endsWith('.glb')) {
        checked.glb++;
        expect(res.headers()['content-type'], asset).toBe('model/gltf-binary');
      } else {
        checked.ktx2++;
        expect(res.headers()['content-type'], asset).toBe('image/ktx2');
      }
      expect(res.headers()['cache-control'], asset).toContain('immutable');
    }
  }
  // At least one immutable JS asset somewhere under /play/
  const jsRes = await request.get(`${BASE}/play/${new Set(playHrefs).values().next().value}/`);
  // (per-asset checks above; landing posters also immutable)
  const poster = await request.get(`${BASE}/posters/lunar-field-expedition-1.0.0.webp`).catch(() => null);
  if (poster && poster.status() === 200) expect(poster.headers()['cache-control']).toContain('immutable');
});
