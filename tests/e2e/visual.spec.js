// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotDir = path.resolve('tests/screenshots');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'models', path: '/models/' },
  { name: 'context', path: '/context/' },
  { name: 'harnesses', path: '/harnesses/' },
  { name: 'tools', path: '/tools/' },
  { name: 'orchestration', path: '/orchestration/' },
  { name: 'forge', path: '/forge/' },
];

const CATALOG_PAGES = [
  { name: 'models', path: '/models/', jumpSelector: '.archive-jump', catalogSelector: '#catalog-grid .catalog-card' },
  { name: 'harnesses', path: '/harnesses/', jumpSelector: '.archive-jump', catalogSelector: '#catalog-grid .catalog-card' },
  { name: 'tools', path: '/tools/', jumpSelector: '.archive-jump', catalogSelector: '.tile, .card' },
  { name: 'orchestration', path: '/orchestration/', jumpSelector: '.archive-jump', catalogSelector: '.card' },
];

test.describe('Visual — Page screenshots (desktop 1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const pg of PAGES) {
    test(`${pg.name} — desktop`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      // Wait for content to render
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotDir, `${pg.name}-desktop.png`),
        fullPage: false,
      });
    });
  }
});

test.describe('Visual — Page screenshots (mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const pg of PAGES) {
    test(`${pg.name} — mobile`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotDir, `${pg.name}-mobile.png`),
        fullPage: false,
      });
    });
  }
});

test.describe('Visual — Catalog revealed (desktop 1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const pg of CATALOG_PAGES) {
    test(`${pg.name} catalog — desktop`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      // For orchestration, first clear the default Core lens
      if (pg.name === 'orchestration') {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // Scroll to catalog section
      const jumpLink = page.locator(pg.jumpSelector);
      if (await jumpLink.count() > 0) {
        await jumpLink.click();
        await page.waitForTimeout(500);
      }

      // Wait for cards to appear
      const cards = page.locator(pg.catalogSelector);
      if (pg.name !== 'harnesses') {
        // harnesses might have empty catalog
        await cards.first().waitFor({ timeout: 10000 }).catch(() => {});
      }
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, `${pg.name}-catalog-desktop.png`),
        fullPage: false,
      });
    });
  }
});

test.describe('Visual — Catalog revealed (mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const pg of CATALOG_PAGES) {
    test(`${pg.name} catalog — mobile`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      if (pg.name === 'orchestration') {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      const jumpLink = page.locator(pg.jumpSelector);
      if (await jumpLink.count() > 0) {
        await jumpLink.click();
        await page.waitForTimeout(500);
      }

      const cards = page.locator(pg.catalogSelector);
      if (pg.name !== 'harnesses') {
        await cards.first().waitFor({ timeout: 10000 }).catch(() => {});
      }
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, `${pg.name}-catalog-mobile.png`),
        fullPage: false,
      });
    });
  }
});
