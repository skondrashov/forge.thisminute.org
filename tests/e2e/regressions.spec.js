// @ts-check
import { test, expect } from '@playwright/test';

// ─── Bug 1: Mobile nav dropdown visible on desktop ──────────────────────
test.describe('Regression — Mobile nav dropdown hidden on desktop', () => {

  test.describe('Desktop viewport (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('site-nav-dropdown is not visible on desktop', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const dropdown = page.locator('.site-nav-dropdown');
      // Element may exist in DOM (injected by JS) but must not be visible
      if (await dropdown.count() > 0) {
        await expect(dropdown).not.toBeVisible();
      }
    });

    test('nav-scrim is not visible on desktop', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const scrim = page.locator('.nav-scrim');
      if (await scrim.count() > 0) {
        await expect(scrim).not.toBeVisible();
      }
    });

    test('hamburger button is not visible on desktop', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      const hamburger = page.locator('.nav-hamburger');
      if (await hamburger.count() > 0) {
        await expect(hamburger).not.toBeVisible();
      }
    });
  });

  test.describe('Mobile viewport (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('hamburger opens dropdown and scrim on mobile', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const hamburger = page.locator('.nav-hamburger');
      await expect(hamburger).toBeVisible();

      // Open the dropdown
      await hamburger.click();
      await page.waitForTimeout(300);

      const dropdown = page.locator('.site-nav-dropdown');
      await expect(dropdown).toHaveClass(/open/);

      // Scrim should also be active/visible
      const scrim = page.locator('.nav-scrim');
      await expect(scrim).toBeVisible();
    });
  });
});


// ─── Bug 2: Orchestration filter dropdowns broken via SPA navigation ────
test.describe('Regression — Orchestration filters work after SPA navigation', () => {

  test('filter panel opens on first click after SPA navigation to /orchestration/', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Start at home — this is the critical path: SPA nav, not direct URL
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Navigate to orchestration via SPA router
    await page.locator('.site-nav a[href="/orchestration/"]').click();

    // Wait for orchestration cards to render
    await page.locator('.card').first().waitFor({ timeout: 10000 });

    // Clear default lens filter if active
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Click the domain panel header — this is where the double-init bug manifested
    const domainHeader = page.locator('#domain-panel-header');
    await domainHeader.click();
    await page.waitForTimeout(300);

    // The panel should now be expanded (not toggled on then immediately off)
    const domainPanel = page.locator('#domain-panel');
    await expect(domainPanel).toHaveClass(/expanded/);

    // Verify the filter tiles inside are visible
    const filterTiles = page.locator('#domain-tiles .filter-tile');
    const tileCount = await filterTiles.count();
    expect(tileCount).toBeGreaterThan(0);
    await expect(filterTiles.first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('structure panel also works after SPA navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await page.locator('.site-nav a[href="/orchestration/"]').click();
    await page.locator('.card').first().waitFor({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const structureHeader = page.locator('#structure-panel-header');
    await structureHeader.click();
    await page.waitForTimeout(300);

    const structurePanel = page.locator('#structure-panel');
    await expect(structurePanel).toHaveClass(/expanded/);
  });

  test('filter panel works on direct URL access (baseline)', async ({ page }) => {
    // This always worked, but verifying as baseline
    await page.goto('/orchestration/', { waitUntil: 'networkidle' });
    await page.locator('.card').first().waitFor({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.locator('#domain-panel-header').click();
    await page.waitForTimeout(300);

    await expect(page.locator('#domain-panel')).toHaveClass(/expanded/);
  });
});


// ─── Bug 3: Tools mobile filter dropdowns ugly / broken layout ──────────
test.describe('Regression — Tools filter panels render as overlays on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('filter panel body uses fixed positioning on mobile', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click the OS filter panel header to open it
    const osHeader = page.locator('#os-panel-header');
    await osHeader.click();
    await page.waitForTimeout(300);

    // Verify the panel is expanded
    await expect(page.locator('#os-panel')).toHaveClass(/expanded/);

    // Verify the filter panel body has fixed positioning (overlay, not inline)
    const position = await page.locator('#os-panel .filter-panel-body').evaluate(
      el => getComputedStyle(el).position
    );
    expect(position).toBe('fixed');
  });

  test('filter panel body appears as visible overlay on mobile', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open the pricing panel
    await page.locator('#pricing-panel-header').click();
    await page.waitForTimeout(300);

    await expect(page.locator('#pricing-panel')).toHaveClass(/expanded/);

    const panelBody = page.locator('#pricing-panel .filter-panel-body');
    await expect(panelBody).toBeVisible();

    // Verify tiles are visible inside
    const tiles = page.locator('#pricing-tiles .filter-tile');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);
    await expect(tiles.first()).toBeVisible();
  });

  test('no console errors when opening filter panels on mobile', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Open each panel in sequence
    const panelHeaders = ['#os-panel-header', '#pricing-panel-header', '#lang-panel-header', '#cat-filter-panel-header'];
    for (const headerId of panelHeaders) {
      const header = page.locator(headerId);
      if (await header.count() > 0) {
        await header.click();
        await page.waitForTimeout(300);
      }
    }

    expect(errors).toEqual([]);
  });
});


// ─── Bug 4: "LANGUAGE" text truncated on desktop ────────────────────────
test.describe('Regression — Filter panel titles not truncated on desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('all tools filter panel titles are fully visible (no text truncation)', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const titles = page.locator('.filter-panel-title');
    const count = await titles.count();
    expect(count).toBeGreaterThanOrEqual(4); // OS, Price, Language, Category

    for (let i = 0; i < count; i++) {
      const title = titles.nth(i);
      await expect(title).toBeVisible();

      // Check that scrollWidth equals clientWidth (no overflow/truncation)
      const isTruncated = await title.evaluate(el => el.scrollWidth > el.clientWidth);
      const titleText = await title.textContent();
      expect(isTruncated, `Title "${titleText?.trim()}" should not be truncated`).toBe(false);
    }
  });

  test('Language title specifically shows full text', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const langTitle = page.locator('#lang-panel .filter-panel-title');
    await expect(langTitle).toBeVisible();

    // Verify text content starts with "Language"
    const text = await langTitle.textContent();
    expect(text?.trim()).toMatch(/^Language/);

    // No truncation
    const isTruncated = await langTitle.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(isTruncated).toBe(false);
  });
});


// ─── Bug 5: Floating Categories button replaced by proper filter panel ──
test.describe('Regression — Category filter panel replaces floating button', () => {

  test.describe('Desktop (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('cat-filter-panel exists in the filter row', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const catPanel = page.locator('#cat-filter-panel');
      await expect(catPanel).toBeVisible();

      // It should be inside the filter-row
      const isInFilterRow = await catPanel.evaluate(
        el => !!el.closest('.filter-row')
      );
      expect(isInFilterRow).toBe(true);
    });

    test('no floating action button (.mobile-cat-btn) exists', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const fab = page.locator('.mobile-cat-btn');
      const count = await fab.count();
      // Either it doesn't exist or it's hidden
      if (count > 0) {
        await expect(fab).not.toBeVisible();
      }
    });

    test('category filter actually filters tools on desktop', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Init ordering fix: taxonomy is set before renderAllFilters in init(),
      // so category tiles should be populated on initial load — no workaround needed.

      // Count initial visible tiles/cards
      const tilesBefore = await page.locator('.tile').count();
      expect(tilesBefore).toBeGreaterThan(0);

      // Open the category filter panel
      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);
      await expect(page.locator('#cat-filter-panel')).toHaveClass(/expanded/);

      // Verify category tiles are populated without needing a re-render trigger
      const catTileCount = await page.locator('#cat-tiles .filter-tile').count();
      expect(catTileCount).toBeGreaterThan(1); // All tile + at least one category

      // Click a non-"All" category tile
      const catTile = page.locator('#cat-tiles .filter-tile:not(.filter-tile-all)').first();
      await catTile.click();
      await page.waitForTimeout(500);

      // Content should have changed (filtered down to one category)
      const tilesAfter = await page.locator('.tile').count();
      const cardsAfter = await page.locator('.card').count();
      // Either tiles reduced or we switched to card view
      expect(tilesAfter + cardsAfter).toBeGreaterThan(0);
      expect(tilesAfter).toBeLessThan(tilesBefore);
    });
  });

  test.describe('Mobile (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('cat-filter-panel exists on mobile', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const catPanel = page.locator('#cat-filter-panel');
      const count = await catPanel.count();
      expect(count).toBe(1);
    });

    test('no floating action button (.mobile-cat-btn) on mobile', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const fab = page.locator('.mobile-cat-btn');
      const count = await fab.count();
      if (count > 0) {
        await expect(fab).not.toBeVisible();
      }
    });

    test('category filter works on mobile', async ({ page }) => {
      await page.goto('/tools/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Init ordering fix: taxonomy is set before renderAllFilters in init(),
      // so category tiles should be populated on initial load — no workaround needed.

      const tilesBefore = await page.locator('.tile').count();
      expect(tilesBefore).toBeGreaterThan(0);

      // Open category filter panel
      await page.locator('#cat-filter-panel-header').click();
      await page.waitForTimeout(300);

      // Click a category tile via JS (fixed-position panel on mobile)
      await page.evaluate(() => {
        const tile = document.querySelector('#cat-tiles .filter-tile:not(.filter-tile-all)');
        if (tile) tile.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await page.waitForTimeout(500);

      const tilesAfter = await page.locator('.tile').count();
      expect(tilesAfter).toBeLessThan(tilesBefore);
    });
  });
});
