// @ts-check
import { test, expect } from '@playwright/test';

const SECTIONS = [
  { name: 'LLMs', path: '/', bodyClass: null },
  { name: 'Models', path: '/models/', bodyClass: 'section-models' },
  { name: 'Context', path: '/context/', bodyClass: 'section-context' },
  { name: 'Tools', path: '/tools/', bodyClass: 'section-tools' },
  { name: 'Orchestration', path: '/orchestration/', bodyClass: 'section-orchestration' },
  { name: 'Forge', path: '/forge/', bodyClass: 'section-forge' },
  { name: 'Harnesses', path: '/harnesses/', bodyClass: 'section-harnesses' },
];

test.describe('SPA Router — Navigation', () => {

  test('navigate from home to each section via nav links (SPA, no full reload)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Mark the window to detect full reloads
    await page.evaluate(() => { window.__spaMarker = true; });

    for (const section of SECTIONS.filter(s => s.path !== '/')) {
      const navLink = page.locator(`.site-nav a[href="${section.path}"]`);
      await navLink.click();
      // Wait for content to swap
      await page.waitForTimeout(800);

      // Verify SPA — marker should still exist (no full reload)
      const marker = await page.evaluate(() => window.__spaMarker);
      expect(marker).toBe(true);

      // Verify URL changed
      expect(page.url()).toContain(section.path);
    }
  });

  test('back/forward button works (popstate)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Navigate to models
    await page.locator('.site-nav a[href="/models/"]').click();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/models/');

    // Navigate to context
    await page.locator('.site-nav a[href="/context/"]').click();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/context/');

    // Go back to models
    await page.goBack();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/models/');

    // Go forward to context
    await page.goForward();
    await page.waitForTimeout(800);
    expect(page.url()).toContain('/context/');

    // Go back twice to home
    await page.goBack();
    await page.waitForTimeout(800);
    await page.goBack();
    await page.waitForTimeout(800);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('direct URL access to each section works', async ({ page }) => {
    for (const section of SECTIONS) {
      await page.goto(section.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Title should be present
      const title = await page.title();
      expect(title).toBeTruthy();

      // Page content should have rendered
      const pageEl = page.locator('#page');
      await expect(pageEl).toBeVisible();
    }
  });

  test('aria-current="page" updates on the correct nav link after navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const section of SECTIONS) {
      if (section.path !== '/') {
        await page.locator(`.site-nav a[href="${section.path}"]`).click();
        await page.waitForTimeout(800);
      }

      // The nav link matching this section should have aria-current="page"
      const activeLink = page.locator(`.site-nav a[aria-current="page"]`);
      const activeHref = await activeLink.first().getAttribute('href');
      if (section.path === '/') {
        expect(activeHref).toBe('/');
      } else {
        expect(activeHref).toBe(section.path);
      }
    }
  });

  test('favicon changes per section', async ({ page }) => {
    const favicons = new Set();

    for (const section of SECTIONS) {
      await page.goto(section.path, { waitUntil: 'networkidle' });
      const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
      if (favicon) favicons.add(favicon);
    }

    // We expect at least a few different favicons (not all pages necessarily have unique ones)
    expect(favicons.size).toBeGreaterThanOrEqual(3);
  });

  test('no console errors during a full navigation sequence', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const sequence = ['/models/', '/context/', '/tools/', '/orchestration/', '/forge/', '/'];
    for (const path of sequence) {
      const navLink = page.locator(`.site-nav a[href="${path}"]`);
      await navLink.click();
      await page.waitForTimeout(1000);
    }

    expect(errors).toEqual([]);
  });

  test('theme toggle state persists across SPA navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Determine current mode
    const isLightBefore = await page.evaluate(() => document.body.classList.contains('light-mode'));

    // Toggle theme
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);

    const isLightAfterToggle = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightAfterToggle).toBe(!isLightBefore);

    // Navigate to another section
    await page.locator('.site-nav a[href="/models/"]').click();
    await page.waitForTimeout(800);

    // Theme should persist
    const isLightAfterNav = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightAfterNav).toBe(!isLightBefore);

    // Navigate to yet another section
    await page.locator('.site-nav a[href="/forge/"]').click();
    await page.waitForTimeout(800);

    const isLightAfterNav2 = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightAfterNav2).toBe(!isLightBefore);
  });

  test('body classes update correctly per section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    for (const section of SECTIONS.filter(s => s.bodyClass)) {
      await page.locator(`.site-nav a[href="${section.path}"]`).click();
      await page.waitForTimeout(800);

      const hasClass = await page.evaluate(
        (cls) => document.body.classList.contains(cls),
        section.bodyClass
      );
      expect(hasClass).toBe(true);

      // Previous section classes should be removed
      for (const other of SECTIONS.filter(s => s.bodyClass && s.bodyClass !== section.bodyClass)) {
        const hasOther = await page.evaluate(
          (cls) => document.body.classList.contains(cls),
          other.bodyClass
        );
        expect(hasOther).toBe(false);
      }
    }
  });
});
