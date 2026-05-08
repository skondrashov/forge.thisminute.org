// @ts-check
import { test, expect } from '@playwright/test';

// ─── Models catalog ─────────────────────────────────────────
test.describe('Catalogs — Models', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/models/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('page loads and renders model cards', async ({ page }) => {
    const cards = page.locator('#catalog-grid .catalog-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(40);
  });

  test('vendor jump nav renders and filters cards', async ({ page }) => {
    const navButtons = page.locator('#catalog-nav button');
    const buttonCount = await navButtons.count();
    expect(buttonCount).toBeGreaterThan(5); // Multiple vendors

    // Click a vendor filter
    const totalBefore = await page.locator('#catalog-grid .catalog-card').count();
    await navButtons.first().click();
    await page.waitForTimeout(300);
    const totalAfter = await page.locator('#catalog-grid .catalog-card').count();
    expect(totalAfter).toBeLessThan(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  test('clicking a vendor filter again clears the filter', async ({ page }) => {
    const totalBefore = await page.locator('#catalog-grid .catalog-card').count();
    const firstBtn = page.locator('#catalog-nav button').first();

    // Click to filter
    await firstBtn.click();
    await page.waitForTimeout(300);

    // Click again to clear
    await firstBtn.click();
    await page.waitForTimeout(300);
    const totalAfterClear = await page.locator('#catalog-grid .catalog-card').count();
    expect(totalAfterClear).toBe(totalBefore);
  });

  test('stats bar shows counts', async ({ page }) => {
    const statsEl = page.locator('#catalog-stats');
    await expect(statsEl).toBeVisible();
    const statsText = await statsEl.textContent();
    // Should contain numbers
    expect(statsText).toMatch(/\d+/);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/models/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

// ─── Harnesses catalog ──────────────────────────────────────
test.describe('Catalogs — Harnesses', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/harnesses/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  });

  test('page loads and renders harness cards or shows empty state gracefully', async ({ page }) => {
    const cards = page.locator('#catalog-grid .catalog-card');
    const cardCount = await cards.count();
    // The catalog may have content (HARNESSES array is populated) or be empty
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    }
    // Even if empty, the page should not show errors — the hero should be visible
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('setting nav renders and filters cards', async ({ page }) => {
    const navButtons = page.locator('#catalog-nav button');
    const buttonCount = await navButtons.count();
    if (buttonCount === 0) {
      test.skip();
      return;
    }
    expect(buttonCount).toBeGreaterThan(0);

    const totalBefore = await page.locator('#catalog-grid .catalog-card').count();
    await navButtons.first().click();
    await page.waitForTimeout(300);
    const totalAfter = await page.locator('#catalog-grid .catalog-card').count();
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/harnesses/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

// ─── Tools catalog ──────────────────────────────────────────
test.describe('Catalogs — Tools', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Tools has a lot of data to load
  });

  test('page loads and renders category tiles or cards', async ({ page }) => {
    // Tools page starts at top-level taxonomy tiles
    const tiles = page.locator('.tile');
    const cards = page.locator('.card');
    const tileCount = await tiles.count();
    const cardCount = await cards.count();
    expect(tileCount + cardCount).toBeGreaterThan(0);
  });

  test('search filters visible entries', async ({ page }) => {
    const searchInput = page.locator('.search-box input');
    await searchInput.fill('git');
    await page.waitForTimeout(500);

    // Should have filtered results
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    // Some git-related tools should appear
    expect(cardCount).toBeGreaterThan(0);
  });

  test('clearing search restores category tile view', async ({ page }) => {
    // Before search: should be in tile/taxonomy view
    const tilesBefore = await page.locator('.tile').count();
    expect(tilesBefore).toBeGreaterThan(0);

    const searchInput = page.locator('.search-box input');
    await searchInput.fill('docker');
    await page.waitForTimeout(500);

    // Search shows individual cards, tiles go away
    const cardsFiltered = await page.locator('.card').count();
    expect(cardsFiltered).toBeGreaterThan(0);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Should go back to taxonomy tile view
    const tilesAfter = await page.locator('.tile').count();
    expect(tilesAfter).toBe(tilesBefore);
  });

  test('category filter panel exists', async ({ page }) => {
    // OS panel should exist
    const osPanel = page.locator('#os-panel');
    if (await osPanel.count() > 0) {
      const panelHeader = page.locator('#os-panel .filter-panel-header');
      if (await panelHeader.count() > 0) {
        await panelHeader.click();
        // Should see filter tiles
        const filterTiles = page.locator('#os-panel .filter-tile');
        const count = await filterTiles.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('keyboard Escape closes detail drawer if open', async ({ page }) => {
    // Search for something to get cards
    const searchInput = page.locator('.search-box input');
    await searchInput.fill('git');
    await page.waitForTimeout(500);

    // Click a card to open detail
    const card = page.locator('.card').first();
    if (await card.count() > 0) {
      await card.click();
      await page.waitForTimeout(300);

      // Detail panel should be open
      const detail = page.locator('.detail');
      await expect(detail).toHaveClass(/active/);

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(detail).not.toHaveClass(/active/);
    }
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });
});

// ─── Orchestration catalog (gap-fill, not duplicating existing tests) ────
test.describe('Catalogs — Orchestration (supplemental)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/orchestration/', { waitUntil: 'networkidle' });
    await page.locator('.card').first().waitFor();
    // Clear default lens
    await page.keyboard.press('Escape');
  });

  test('sort buttons change card order', async ({ page }) => {
    // Get first card name with default sort
    const firstCardDefault = await page.locator('.card .card-name').first().textContent();

    // Click A-Z sort
    await page.locator('#sort-name').click();
    await page.waitForTimeout(300);
    const firstCardAZ = await page.locator('.card .card-name').first().textContent();

    // Click Shuffle sort
    await page.locator('#sort-random').click();
    await page.waitForTimeout(300);
    const firstCardRandom = await page.locator('.card .card-name').first().textContent();

    // At least one sort should produce a different first card
    const allSame = firstCardDefault === firstCardAZ && firstCardAZ === firstCardRandom;
    // Very unlikely all three would be the same, but not impossible with a single-element set
    expect(allSame).toBe(false);
  });

  test('combining domain and structure filters narrows results', async ({ page }) => {
    const totalCards = await page.locator('.card').count();

    // Open domain panel and pick a filter
    await page.locator('#domain-panel-header').click();
    const domainTile = page.locator('#domain-tiles .filter-tile[data-domain]:not(.filter-tile-all)').first();
    await domainTile.click();
    await page.waitForTimeout(300);
    const afterDomain = await page.locator('.card').count();

    // Also open structure panel and pick a filter
    await page.locator('#structure-panel-header').click();
    const structureTile = page.locator('#structure-tiles .filter-tile[data-sc]:not(.filter-tile-all)').first();
    await structureTile.click();
    await page.waitForTimeout(300);
    const afterBoth = await page.locator('.card').count();

    expect(afterDomain).toBeLessThanOrEqual(totalCards);
    expect(afterBoth).toBeLessThanOrEqual(afterDomain);
  });

  test('search combined with filter narrows results further', async ({ page }) => {
    // Apply a domain filter
    await page.locator('#domain-panel-header').click();
    await page.locator('#domain-tiles .filter-tile[data-domain]:not(.filter-tile-all)').first().click();
    await page.waitForTimeout(300);
    const afterFilter = await page.locator('.card').count();

    // Also search
    await page.locator('#search').fill('pipeline');
    await page.waitForTimeout(300);
    const afterSearchAndFilter = await page.locator('.card').count();

    expect(afterSearchAndFilter).toBeLessThanOrEqual(afterFilter);
  });

  test('no console errors during filter and sort interactions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Click through sorts
    await page.locator('#sort-name').click();
    await page.waitForTimeout(200);
    await page.locator('#sort-agents').click();
    await page.waitForTimeout(200);
    await page.locator('#sort-random').click();
    await page.waitForTimeout(200);

    // Apply and clear search
    await page.locator('#search').fill('test');
    await page.waitForTimeout(200);
    await page.locator('#search').fill('');
    await page.waitForTimeout(200);

    expect(errors).toEqual([]);
  });
});
