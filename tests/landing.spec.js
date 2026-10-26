/**
 * Landing page tests: content, every link, filters, keyboard navigation, axe,
 * and a 320 px reflow check. Lighthouse is run separately by CI (lighthouserc).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing shows the header, intro and project grid', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/realistic 3d/i);
  await expect(page.locator('.cards > li')).toHaveCount(7);
  // one h1 only
  expect(await page.locator('h1').count()).toBe(1);
});

test('every released project card has Play + case-study links; coming-soon cards have no Play', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.cards > li');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const isSoon = await card.locator('.badge-soon').count();
    if (isSoon) {
      await expect(card.getByRole('link', { name: /^Play / })).toHaveCount(0);
    } else {
      await expect(card.getByRole('link', { name: /^Play / })).toHaveCount(1);
      await expect(card.getByRole('link', { name: /Case study on GitHub/ })).toHaveCount(1);
    }
  }
});

test('all internal links resolve and GitHub links point at iwyusdaz repos', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  const unique = [...new Set(hrefs)];
  for (const href of unique) {
    if (href.startsWith('/')) {
      const res = await page.request.get(new URL(href, 'http://127.0.0.1:4173').toString());
      expect(res.status(), href).toBeLessThan(400);
    } else if (href.startsWith('https://github.com/')) {
      expect(href, 'github links must be iwyusdaz').toMatch(/^https:\/\/github\.com\/iwyusdaz(\/|$)/);
    }
  }
});

test('filter buttons toggle cards and announce the count', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mini course' }).click();
  await expect(page.locator('.cards > li:not([hidden])')).not.toHaveCount(7);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.cards > li:not([hidden])')).toHaveCount(7);
});

test('keyboard navigation works through filters and cards', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  let focused = await page.evaluate(() => document.activeElement.className);
  expect(focused).toContain('skip-link');
  const filterBtn = page.locator('.filter-btn').first();
  await filterBtn.focus();
  await page.keyboard.press('Enter');
  await expect(filterBtn).toHaveAttribute('aria-pressed', 'true');
});

test('no critical or serious axe issues', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  if (bad.length) console.log(JSON.stringify(bad, null, 2));
  expect(bad).toEqual([]);
});

test('reflows at 320 px without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);
});

test('credits, accessibility and 404 pages pass axe and link back', async ({ page }) => {
  for (const path of ['/credits/', '/accessibility/', '/definitely-missing/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(bad, path).toEqual([]);
  }
  await page.goto('/definitely-missing/');
  await expect(page.getByRole('link', { name: 'projects page' })).toBeVisible();
});
