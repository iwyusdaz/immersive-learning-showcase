/**
 * For every live slug in apps.json: load /play/<slug>/ from the assembled dist
 * (served with the same headers as production), check for no failed requests,
 * no console errors, canvas or fallback present, text mode reachable, and
 * "All projects" returning to /.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const apps = JSON.parse(readFileSync(new URL('../apps.json', import.meta.url), 'utf8')).apps.filter((a) => a.status === 'live');

for (const app of apps) {
  test(`play/${app.slug}/ loads cleanly under the site CSP`, async ({ page }) => {
    const failed = [];
    const errors = [];
    page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.url()} -> ${r.status()}`); });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(`/play/${app.slug}/`, { waitUntil: 'networkidle', timeout: 45_000 });

    expect(failed, `failed requests: ${failed.join('\n')}`).toEqual([]);
    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);

    const canvas = page.locator('canvas');
    const fallback = page.locator('[data-webgl-fallback]');
    const canvasOk = (await canvas.count()) > 0 && ((await canvas.first().boundingBox())?.height ?? 0) > 0;
    expect(canvasOk || (await fallback.count()) > 0, 'canvas or WebGL fallback expected').toBe(true);

    await page.getByRole('button', { name: /text mode/i }).first().click();
    await expect(page.locator('#textmode')).toBeVisible();

    const link = page.getByRole('link', { name: /all projects/i }).first();
    await expect(link).toHaveAttribute('href', '/');
    // CSP sanity: the response headers on the HTML must include our CSP
    const res = await page.request.get(`/play/${app.slug}/`);
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  });
}
