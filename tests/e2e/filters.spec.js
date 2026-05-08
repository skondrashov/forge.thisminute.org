// @ts-check
import { test, expect } from '@playwright/test';

// ─── Tools page — Filter panels ────────────────────────────────────────────
test.describe('Filters — Tools page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Tools loads substantial data
  });

  // ── OS filter panel ──────────────────────────────────────────────────────
  test.describe('OS filter (#os-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#os-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#os-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#os-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#os-tiles .filter-tile');
      const count = await tiles.count();
      // All tile + at least one OS option
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile changes the stats bar (filter applied)', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      await page.locator('#os-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#os-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      const statsAfter = await page.locator('#stat-entries').textContent();
      // Stats should change to show "X of Y" when filter is active
      expect(statsAfter).not.toBe(statsBefore);
      expect(statsAfter).toMatch(/of/);
    });

    test('clicking All tile clears the filter and restores stats', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      // Apply filter
      await page.locator('#os-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#os-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel (it closes after tile click triggers re-render)
      await page.locator('#os-panel-header').click();
      await page.waitForTimeout(300);

      // Clear filter
      await page.locator('#os-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const statsAfterClear = await page.locator('#stat-entries').textContent();
      expect(statsAfterClear).toBe(statsBefore);
    });
  });

  // ── Pricing filter panel ─────────────────────────────────────────────────
  test.describe('Pricing filter (#pricing-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#pricing-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#pricing-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#pricing-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#pricing-tiles .filter-tile');
      const count = await tiles.count();
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile changes the stats bar (filter applied)', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      await page.locator('#pricing-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#pricing-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      const statsAfter = await page.locator('#stat-entries').textContent();
      expect(statsAfter).not.toBe(statsBefore);
      expect(statsAfter).toMatch(/of/);
    });

    test('clicking All tile clears the filter and restores stats', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      await page.locator('#pricing-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#pricing-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel
      await page.locator('#pricing-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#pricing-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const statsAfterClear = await page.locator('#stat-entries').textContent();
      expect(statsAfterClear).toBe(statsBefore);
    });
  });

  // ── Language filter panel ────────────────────────────────────────────────
  test.describe('Language filter (#lang-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#lang-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#lang-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#lang-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#lang-tiles .filter-tile');
      const count = await tiles.count();
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile changes the stats bar (filter applied)', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      await page.locator('#lang-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#lang-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      const statsAfter = await page.locator('#stat-entries').textContent();
      expect(statsAfter).not.toBe(statsBefore);
      expect(statsAfter).toMatch(/of/);
    });

    test('clicking All tile clears the filter and restores stats', async ({ page }) => {
      const statsBefore = await page.locator('#stat-entries').textContent();

      await page.locator('#lang-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#lang-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel
      await page.locator('#lang-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#lang-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const statsAfterClear = await page.locator('#stat-entries').textContent();
      expect(statsAfterClear).toBe(statsBefore);
    });
  });

  // ── Category filter panel ────────────────────────────────────────────────
  test.describe('Category filter (#cat-filter-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#cat-filter-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('category tiles are populated on initial page load (no workaround needed)', async ({ page }) => {
      // This verifies the init ordering fix: taxonomy is set before renderAllFilters,
      // so category tiles should be populated on first render without any user interaction.
      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#cat-tiles .filter-tile');
      const count = await tiles.count();
      // All tile + at least one category group
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile changes the displayed content', async ({ page }) => {
      const tilesBefore = await page.locator('.tile').count();
      expect(tilesBefore).toBeGreaterThan(0);

      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);

      const nonAllTile = page.locator('#cat-tiles .filter-tile:not(.filter-tile-all)').first();
      await nonAllTile.click();
      await page.waitForTimeout(500);

      // Category filter navigates into a group, reducing the tile count
      const tilesAfter = await page.locator('.tile').count();
      expect(tilesAfter).toBeLessThan(tilesBefore);
    });

    test('clicking All tile clears the filter and restores content', async ({ page }) => {
      const tilesBefore = await page.locator('.tile').count();

      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#cat-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel
      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#cat-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const tilesAfterClear = await page.locator('.tile').count();
      expect(tilesAfterClear).toBe(tilesBefore);
    });
  });
});

// ─── Orchestration page — Filter panels ─────────────────────────────────────
test.describe('Filters — Orchestration page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/orchestration/', { waitUntil: 'networkidle' });
    await page.locator('.card').first().waitFor({ timeout: 10000 });
    // Clear default "Core" lens filter to see all cards
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  // ── Domain (Lens) filter panel ───────────────────────────────────────────
  test.describe('Domain filter (#domain-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#domain-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#domain-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#domain-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#domain-tiles .filter-tile');
      const count = await tiles.count();
      // All tile + core, wild, garden = 4
      expect(count).toBeGreaterThanOrEqual(4);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile reduces the card count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#domain-panel-header').click();
      await page.waitForTimeout(300);

      const nonAllTile = page.locator('#domain-tiles .filter-tile:not(.filter-tile-all)').first();
      await nonAllTile.click();
      await page.waitForTimeout(500);

      const filteredCards = await page.locator('.card').count();
      expect(filteredCards).toBeLessThan(totalCards);
      expect(filteredCards).toBeGreaterThan(0);
    });

    test('clicking All tile clears the filter and restores the count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#domain-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#domain-tiles .filter-tile:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel (it closes after tile click triggers re-render)
      await page.locator('#domain-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#domain-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const restoredCards = await page.locator('.card').count();
      expect(restoredCards).toBe(totalCards);
    });
  });

  // ── Structure filter panel ───────────────────────────────────────────────
  test.describe('Structure filter (#structure-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#structure-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#structure-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#structure-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#structure-tiles .filter-tile');
      const count = await tiles.count();
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile reduces the card count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#structure-panel-header').click();
      await page.waitForTimeout(300);

      const nonAllTile = page.locator('#structure-tiles .filter-tile[data-sc]:not(.filter-tile-all)').first();
      await nonAllTile.click();
      await page.waitForTimeout(500);

      const filteredCards = await page.locator('.card').count();
      expect(filteredCards).toBeLessThan(totalCards);
      expect(filteredCards).toBeGreaterThan(0);
    });

    test('clicking All tile clears the filter and restores the count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#structure-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#structure-tiles .filter-tile[data-sc]:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel
      await page.locator('#structure-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#structure-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const restoredCards = await page.locator('.card').count();
      expect(restoredCards).toBe(totalCards);
    });
  });

  // ── Category filter panel ────────────────────────────────────────────────
  test.describe('Category filter (#category-panel)', () => {

    test('panel opens when header is clicked and gains expanded class', async ({ page }) => {
      const panel = page.locator('#category-panel');
      await expect(panel).not.toHaveClass(/expanded/);

      await page.locator('#category-panel-header').click();
      await page.waitForTimeout(300);

      await expect(panel).toHaveClass(/expanded/);
    });

    test('tiles are present and visible inside', async ({ page }) => {
      await page.locator('#category-panel-header').click();
      await page.waitForTimeout(300);

      const tiles = page.locator('#category-tiles .filter-tile');
      const count = await tiles.count();
      expect(count).toBeGreaterThan(1);
      await expect(tiles.first()).toBeVisible();
    });

    test('clicking a non-All tile reduces the card count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#category-panel-header').click();
      await page.waitForTimeout(300);

      const nonAllTile = page.locator('#category-tiles .filter-tile[data-category]:not(.filter-tile-all)').first();
      await nonAllTile.click();
      await page.waitForTimeout(500);

      const filteredCards = await page.locator('.card').count();
      expect(filteredCards).toBeLessThan(totalCards);
      expect(filteredCards).toBeGreaterThan(0);
    });

    test('clicking All tile clears the filter and restores the count', async ({ page }) => {
      const totalCards = await page.locator('.card').count();

      await page.locator('#category-panel-header').click();
      await page.waitForTimeout(300);
      await page.locator('#category-tiles .filter-tile[data-category]:not(.filter-tile-all)').first().click();
      await page.waitForTimeout(500);

      // Re-open panel
      await page.locator('#category-panel-header').click();
      await page.waitForTimeout(300);

      await page.locator('#category-tiles .filter-tile-all').click();
      await page.waitForTimeout(500);

      const restoredCards = await page.locator('.card').count();
      expect(restoredCards).toBe(totalCards);
    });
  });
});
